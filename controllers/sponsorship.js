const log = require('../helpers/log').logger;
const _ = require('lodash');
const moment = require('moment');
const bodybuilder = require('bodybuilder');
const SPONSORSHIPS_TYPE = 'sponsorships';
const PROJECT_RANGES = ['national_sponsorship', 'local', 'digital_media'];
const DEFAULT_RESULT_SIZE = 50;
const SISCOM_PLANS = 'siscom_plans';

const config = require('config');
const esConfig = config.get('elasticsearch');
const es = require('../helpers/esOperation');
const util = require('../helpers/util');
const integracao = require("../helpers/integration");

//Controllers
const siscomPlanController = require("../controllers/siscomPlan");

let _setAlreadyPublished = function (published, already_published) {
    log.info('ProjectController -> setAlreadyPublished');
    return (already_published === false && published === true) ? true : already_published;
};

// TODO TIRAR REQ E BOTAR PARAMETROS PONTUAIS
let _queryRecentSponsorships = (req) => {

    log.debug('SponsorshipController -> queryRecentSponsorships');

    let bob = bodybuilder()
        .query('range', 'updated_at', { gte: req.query.startDate, lte: req.query.finalDate, format: 'yyyy-MM-dd||/M' })
        .andQuery('bool', 'must', { term: { published: true } })
        .sort('updated_at', 'desc');

    if (req.query.type) {
        let tipoSponsorship = req.query.type === 'national' ? 'national_sponsorship' : req.query.type;
        bob = bob.filter('match', 'main_type', tipoSponsorship);
    }

    return es.search({
        index: esConfig.index,
        type: SPONSORSHIPS_TYPE,
        body: bob.from(0).size(DEFAULT_RESULT_SIZE).build()
    }).then(result => util.formatSearchResult(result).map(value => ({
            id: value.id,
            main_type: value.national_sponsorship ? 'national_sponsorship' : (value.local ? 'local' : (value.digital_media ? 'digital_media' : 'error')),
            name: value.name,
            created_by: value.created_by,
            updated_at: value.updated_at,
            main_pdf: value.mainPdf || '',
        }))
    );
};

let _addExhibitionEnd = (exhibition)  => {

    log.debug('SponsorshipController -> addExhibitionEnd');

    // convertion hours to milliseconds
    if (exhibition.start && exhibition.duration) {
        const milliseconds = exhibition.duration * 3600 * 1000;
        const endDate = new Date(Date.parse(exhibition.start) + milliseconds);

        return _.assign(exhibition, { end: endDate.toISOString() });
    }
    return moment(exhibition).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
};



let _create = ({ main_type, data, user }) => {

    log.debug('SponsorshipController -> create');

    const sponsorshipData = _.assign(data, {
        created_at: new Date(),
        updated_at: new Date(),
        created_by: user.username,
        owner: user.group,
        main_type,
        attachments: [],
        already_published: _setAlreadyPublished(data.published, data.already_published)
    });

    PROJECT_RANGES.forEach((range) => {
        const exhibition = _.get(sponsorshipData, `${range}.exhibition`);

        if (exhibition) {
            sponsorshipData[range].exhibition = _addExhibitionEnd(exhibition);
        }
    });

    return _associateSiscomData(sponsorshipData).then(() => {
        return es.index({
            index: esConfig.index,
            type: SPONSORSHIPS_TYPE,
            body: sponsorshipData
        });
    }).then((result) => {
        sponsorshipData.id = result._id;
        return sponsorshipData
    });
};

let _get = ({ id, week_day_fmt }) => {

    log.debug('SponsorshipController -> get');

    return es.get({
        index: esConfig.index,
        type: SPONSORSHIPS_TYPE,
        id,
    }).then(result => _.assign(result._source, {
        id: result._id
    })).then(result => util.formatProgramDays(result, week_day_fmt));
};

let _update = ({ id, data }) => {

    log.debug('SponsorshipController -> update');

    const sponsorshipData = _.assign(data, {
        updated_at: new Date(),
        already_published: _setAlreadyPublished(data.published, data.already_published)
    });

    return _associateSiscomData(sponsorshipData).then(() => {
        return es.update({
            index: esConfig.index,
            type: SPONSORSHIPS_TYPE,
            id,
            body: { doc: sponsorshipData },
        });
    });
};

let _addAttachment = ({ id, attachment })  => {

    log.debug('SponsorshipController -> addAttachment');

    const attachScript = 'ctx._source.attachments.add(params.attachment);\
                           ctx._source.updated_at = params.updated_at';

    return es.update({
        index: esConfig.index,
        type: SPONSORSHIPS_TYPE,
        id,
        body: {
            script: {
                inline: attachScript,
                lang: 'painless',
                params: { attachment, updated_at: new Date() },
            },
        },
    })
        .then(() => attachment);
};

let _getAttachmentURL = ({ bucket, attachment }) => {

    log.debug('SponsorshipController -> getAttachmentURL');

    return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: attachment,
        }, (err, url) => {
            if (err) reject(err);
            else resolve(url)
        })

    });

};


let _deleteAttachment = ({ project_id, bucket, attachment }) => {
    log.debug('SponsorshipController -> deleteAttachment');
    return new Promise((resolve, reject) => {
        s3.deleteObject({
            Bucket: bucket,
            Key: attachment,
        }, (err) => {
            if (err) {return reject(err)}
            log.debug(`Retrieving sponsorship [${project_id}] data form elasticsearch`);
            return _get({ id: project_id })
                .then((project) => {
                    _.remove(project.attachments, item => item.path === attachment);
                    log.debug(`Updating sponsorship [${project_id}] attachments`);
                    return _update({
                        id: project_id,
                        data: _.pick(project, 'attachments'),
                    }).then(result => resolve(result));
                });
        });
    });
};

let _calculatePriorityDate = (sponsorship) => {

    log.debug('SponsorshipController -> calculatePriorityDate');

    // Se o siscom_data não estiver disponível, não podemos fazer nada.
    if (sponsorship.siscom_data === null) {
        return null;
    }

    // A regra é que se houver prazo de renovação, temos que usar o mais novo. Se não houver a informação, usar a data de exibição final
    // Plot twist: como os dados são do siscom, não há como haver um sem haver o outro
    if (sponsorship.siscom_data && sponsorship.siscom_data.quotas.length > 0) {
        let quotasRenewLimit = _.map(sponsorship.siscom_data.quotas, m => {
            return _.reduce(m.soldQuota, (p, c) => {
                if (c.renewLimit) {
                    return new Date(c.renewLimit).getTime();
                }
            }, 0);
        });

        let earliestRenewLimit = _.min(_.compact(quotasRenewLimit));

        if (earliestRenewLimit) {
            return new Date(earliestRenewLimit);
        }
    }
};

let _associateSiscomData = (sponsorshipData) => {

    log.debug('SponsorshipController -> associateSiscomData');

    if (sponsorshipData.siscom_id !== null && typeof sponsorshipData.siscom_id !== 'undefined') {
        return siscomPlanController.getSiscomPlan(sponsorshipData.siscom_id).then(data => {
            return new Promise((resolve) => {
                data = siscomPlanController.fixSiscomQuotaData(data);
                sponsorshipData.availability = data.availability;
                sponsorshipData.siscom_data = data;
                sponsorshipData.priorityDate = _calculatePriorityDate(sponsorshipData);
                resolve();
            });
        });
    }
    else {
        return new Promise((resolve) => resolve());
    }
};


let dataTransformation = function (quotaSource, availableQuotas) {

    log.debug('SponsorshipController -> dataTransformation');

    return _.map(_.groupBy(quotaSource.quotas, g => g.exhibitedAt), (quotas) => {
        const locationData = {};
        locationData.availableQuota = [];
        locationData.soldQuota = [];

        _.map(_.groupBy(quotas, q => q.number), quotaNumberArray => {
            // Consideração somente da última cota, tendo em vista que os outros valores são de patrocinadores anteriores
            let quotaInformation = _.orderBy(quotaNumberArray, 'exhibitionEnd', 'asc');
            let lastQuota = _.takeRight(quotaInformation)[0];
            locationData.location = lastQuota.exhibitedAt;

            if (this.isSoldQuota(lastQuota.renewLimit, lastQuota.exhibitionEnd, quotaSource.purchaseLimitEnd)) {
                locationData.soldQuota.push({
                    clientName: lastQuota.clientName,
                    number: lastQuota.number,
                    renewLimit: moment(new Date(lastQuota.renewLimit)).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
                    exhibitionStart: moment(new Date(lastQuota.exhibitionStart)).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
                    exhibitionEnd: moment(new Date(lastQuota.exhibitionEnd)).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")
                });
            } else {
                locationData.availableQuota.push(lastQuota.number);
                availableQuotas[lastQuota.number - 1] = true;
            }
        });

        return locationData;
    });
};
/**
 * filterAvailableQuotas - Retrieve quota data that matches
 * projects' siscom information and injects at project
 *
 * @param {Array} projects an array of projects
 *
 * @return {Promise<Array>} an array of projects with quota data
 */
let _filterAvailableQuotas = (projects) => {

    log.debug('SponsorshipController -> filterAvailableQuotas');

    if (!projects || !projects.length) {
        return Promise.resolve([]);
    }

    let bob = bodybuilder();
    const terms = _.compact(projects.map(value => value.siscom_id));

    if (terms.length) {
        terms.forEach((value) => {
            bob = bob.orQuery('match', 'id', value);
        });
    } else {
        return Promise.resolve(projects);
    }

    return es.search({
        index: SISCOM_PLANS,
        body: bob.from(0).size(40).build(),
    }).then((result) => {
        const parsedResult = result.hits.hits;
        _.map(projects, (project) => {
            const quotaData = _.find(parsedResult, f => f._source.id === project.siscom_id);

            // Processar dados de quota quando houver
            if (quotaData) {
                const finalData = {};
                finalData.quotas = [];

                let availableQuotas = [];

                const quotaSource = quotaData._source;

                // Agrupamento de cotas por exibidora para contagem de acordo com o número
                let quotaQuantity = _.uniq(_.map(quotaSource.quotas, m => { return m.number })).length;

                finalData.quotas = dataTransformation(quotaSource, availableQuotas);

                finalData.quotas = _.orderBy(finalData.quotas, ['availableQuota.length', 'location'], ["desc", "asc"]);

                finalData.marketType = quotaSource.marketType;
                finalData.updatedAt = quotaSource.updatedAt;
                finalData.status = quotaSource.status;
                finalData.purchaseStatus = quotaSource.purchaseStatus;
                finalData.purchaseLimitStart = moment(new Date(quotaSource.purchaseLimitStart)).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"); // moment(new Date(quotaSource.purchaseLimitStart)).format("YYYY-MM-DDTHH:mm:SSS[Z]")
                finalData.purchaseLimitEnd = moment(new Date(quotaSource.purchaseLimitEnd)).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"); // moment().format("YYYY-MM-DDTHH:mm:SSS[Z]")
                finalData.queueCode = quotaSource.queueCode;

                let availableQuotaCount = availableQuotas.reduce((p, c) => { return c === true ? p + 1 : p }, 0);

                _.assign(finalData,
                    { availableQuotas: availableQuotaCount },
                    { soldQuotas: quotaQuantity - availableQuotaCount }
                );

                return _.assign(project, { siscom_data: finalData });
            }
        });

        return projects;
    });
};

let _updateAttachentHandler = ({ project_id, attachment }) => {

    log.debug('SponsorshipController -> updateAttachentHandler');

    return new Promise((resolve, reject) => {
        _get({ id: project_id })
            .then((project) => {
                _.remove(project.attachments, item => item.path === attachment);
                log.debug(`Updating project [${project_id}] attachments`);
                return _update({
                    id: project_id,
                    data: _.pick(project, 'attachments'),
                }).then(result => resolve(result));
            }).catch((err) => reject (err));
    });
};

let _enviarBarramento = project => {
    return integracao.enviar(project);
};

module.exports = {
    queryRecentSponsorships: _queryRecentSponsorships,
    create: _create,
    get: _get,
    update: _update,
    addAttachment: _addAttachment,
    getAttachmentURL: _getAttachmentURL,
    updateAttachentHandler: _updateAttachentHandler,
    calculatePriorityDate: _calculatePriorityDate,
    filterAvailableQuotas: _filterAvailableQuotas,
    enviarBarramento: _enviarBarramento
};

const log = require('../helpers/log').logger;

const bodybuilder = require('bodybuilder');
const _ = require('lodash');
const moment = require('moment');
const es = require('../helpers/esOperation');
const inspect = require('eyes').inspector({maxLength: 200000});

const SPONSORSHIPS_TYPE = 'net_sponsorships';
const DEFAULT_RESULT_SIZE = 50;

const config = require('config');
const esConfig = config.get('elasticsearch');
const util = require('../helpers/util');

const siscomPlanController = require('./siscomPlan');


let _validateSponsorshipType = (data) => {

    log.debug('NetSponsorshipController -> validateSponsorshipType');

    if (typeof data === 'undefined') {
        return true;
    }

    data = data === 'national' ? 'national_sponsorship' : data;

    switch (data) {
        case 'national_sponsorship':
        case 'local':
        case 'digital_media':
            return true;
        default:
            return false;
    }
};

/**
 * queryRecentSponsorships - Return recent projects data
 *
 * @param {express.req} req request object
 *
 * @return {Promise<Array>} promise containing an array of recent
 * project objects
 */
let _queryRecentSponsorships = (req) => {

    log.debug('NetSponsorshipController -> queryRecentSponsorships');

    let bob = bodybuilder()
        .query('range', 'updated_at', {gte: req.query.startDate, lte: req.query.finalDate, format: 'yyyy-MM-dd||/M'})
        .andQuery('bool', 'must', {term: {published: true}})
        .sort('updated_at', 'desc');

    if (req.query.type) {
        let tipoSponsorship = req.query.type === 'national' ? 'national_sponsorship' : req.query.type;
        bob = bob.filter('match', 'main_type', tipoSponsorship);
    }

    return es.search({
        index: esConfig.index,
        type: SPONSORSHIPS_TYPE,
        body: bob.from(0).size(40).build()
    }).then(result => util.formatSearchResult(result).map(value => ({
        id: value.id,
        main_type: value.national_sponsorship ? 'national_sponsorship' : (value.local ? 'local' : (value.digital_media ? 'digital_media' : 'error')),
        name: value.name,
        created_by: value.created_by,
        updated_at: value.updated_at,
        main_pdf: value.mainPdf || '',
    })));
};


/**
 *
 * @param search_method
 * @param q
 * @param filters
 * @param week_day_fmt
 * @param offset
 * @param client
 */
let _search = ({search_method, q, filters, week_day_fmt, offset = 0, client = 'app'}) => {

    log.debug('NetSponsorshipController -> search');

    log.debug('filters', filters);
    let bob = bodybuilder();
    if (q) {
        // bob = bob.query(search_method, '_all', q);
        // DONE!
        // bob = bob.query('query_string', 'query', `*${q}*`,{"fields": ["_all"]}).orQuery('fuzzy','_all',`*${q}*`)
        // ajuste para incluir pesquisas com acentos usando 'fuzzy'
        bob = bob.query('match_phrase_prefix', {'_all': q}).orQuery('fuzzy', '_all', `*${q}*`);
    }

    let context = {};

    return util.constantListing('regions')
        .then((regions) => {
            context.regions = regions;
            return util.constantListing('states');
        }).then((states) => {
            context.states = states;
            return util.constantListing('exhibitors');
        }).then((exhibitors) => {
            context.exhibitors = exhibitors;
        }).then(() => {
            let dateFilter = {};

            inspect(client, 'client from net_sponsorship');

            if (filters.ft_start_date) {
                dateFilter.gte = moment.utc(filters.ft_start_date, moment.ISO_8601).format("YYYY-MM-DD");
            } else {
                filters.ft_start_date = moment(new Date).utc().format("YYYY-MM-DD");
                dateFilter.gte = moment(new Date).utc().format("YYYY-MM-DD");
            }

            if (filters.ft_end_date) {
                dateFilter.lte = moment.utc(filters.ft_end_date, moment.ISO_8601).format("YYYY-MM-DD");
            } else {
                dateFilter.lte = null;
            }

            if (filters.ft_start_date || filters.ft_end_date) {
                dateFilter.format = "yyyy-MM-dd";
                bob = bob.query('bool', {
                    "should": [
                        {
                            "range": {
                                "priorityDate": {
                                    "gte": dateFilter.gte,
                                    "lte": dateFilter.lte,
                                    "format": "yyyy-MM-dd"
                                }
                            }
                        },
                        {
                            "bool": {
                                "must_not": {
                                    "exists": {
                                        "field": "priorityDate"
                                    }
                                }
                            }
                        }
                    ]
                });
            }

            // Value is being passed as string for some reason: need to parse
            if (!!filters.ft_available_quota) {
                if (JSON.parse(filters.ft_available_quota)) {
                    bob.query('bool', 'should', [{
                        "match": {
                            "siscom_data.purchaseStatus": 1
                        }
                    }, {
                        "match": {
                            "siscom_data.purchaseStatus": 2
                        }
                    }]);
                }
                else {
                    bob.query("match", "siscom_data.purchaseStatus", 3);
                }
            }

            if (client === 'cms') {
                bob = bob.sort('updated_at', 'desc');
            } else {
                bob.sort('siscom_data.purchaseStatus');
                bob.sort('priorityDate');
                bob.sort('main_type');
            }

            log.debug('Searching for net sponsorships with query', bob.build());

            return es.search({
                index: esConfig.index,
                type: SPONSORSHIPS_TYPE,
                body: bob.queryMinimumShouldMatch(1).from(offset).size(DEFAULT_RESULT_SIZE).build()
            }).then(result => util.formatSearchResult(result, week_day_fmt))
                .then((result) => {
                    let exhibitorNames = [];

                    if (filters.ft_region) {
                        let stateIds = _.filter(context.states, x => x.region === filters.ft_region).map(m => m.id);
                        exhibitorNames = _.concat(_.filter(context.exhibitors, x => _.includes(stateIds, x.state)).map(m => m.name), exhibitorNames);
                    }

                    if (filters.ft_state) {
                        exhibitorNames = _.concat(_.filter(context.exhibitors, x => x.state === filters.ft_state).map(m => m.name), exhibitorNames);
                    }

                    if (filters.ft_exhibitor) {
                        let filteredExhibitors = mapExhibitorFilter(context.exhibitors, filters.ft_exhibitor);
                        exhibitorNames = _.concat(filteredExhibitors, exhibitorNames);
                    }

                    inspect(result, 'result');

                    if (exhibitorNames.length > 0) {
                        // filtrar resultados baseados na exibidoras fornecidas
                        _.forEach(result, value => {
                            value.priceTable = _.filter(value.priceTable, f => {
                                return _.includes(exhibitorNames, f.exhibitor);
                            })
                        });
                    }
                    return result;
                })
        });
};


/**
 * get - get a project with given id
 *
 * @param {string}   id           project id
 * @param {boolean}   week_day_fmt  flag to sinalize if week day fields
 * should be transformed to it's configured string representations
 *
 * @return {Promise<Project>} promise containing project data
 */
let _update = ({ id, data }) =>  {
    const projectData = _.assign(data, {
        updated_at: new Date(),
    });

    return _associateSiscomData(projectData).then(() => {
        return es.update({
            index: esConfig.index,
            type: SPONSORSHIPS_TYPE,
            id,
            body: { doc: projectData },
        });
    });
};


let _get = ({id, week_day_fmt}) => {

    log.debug('NetSponsorshipController -> get');

    return es.get({
        index: esConfig.index,
        type: SPONSORSHIPS_TYPE,
        id,
    })
        .then(result => _.assign(result._source, {id: result._id}))
        .then(result => util.formatProgramDays(result, week_day_fmt));
};


let _getAllAttachments = ({id}) => {

    log.debug('NetSponsorshipController -> getAllAttachments');

    return es.get({
        index: esConfig.index,
        type: SPONSORSHIPS_TYPE,
        id: id,
    }).then(result => result._source.attachments);
};

/**
 * addAttachment - Add an attachment to a project at elasticsearch
 *
 * @param {string}   id         Description
 * @param {object}   attachment Description
 *
 * @return {type} Description
 */
let _addAttachment = ({id, attachment}) => {

    log.debug('NetSponsorshipController -> addAttachment');

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
                params: {attachment, updated_at: new Date()},
            },
        },
    })
        .then(() => attachment);
};


let _updateAttachentHandler = ({ project_id, attachment }) => {

    log.debug('NetSponsorshipController -> updateAttachentHandler');

    return new Promise((resolve, reject) => {
        _get({ id: project_id })
            .then((project) => {
                _.remove(project.attachments, item => item.path === attachment);
                return _update({
                    id: project_id,
                    data: _.pick(project, 'attachments'),
                }).then(result => resolve(result));
            }).catch((err) => reject (err));
    });
};


function _associateSiscomData(sponsorshipData) {
    if (sponsorshipData.siscom_id !== null && typeof sponsorshipData.siscom_id !== 'undefined') {
        return siscomPlanController.getSiscomPlan(sponsorshipData.siscom_id).then(data => {
            return new Promise((resolve) => {
                data.quotas = siscomPlanController.fixSiscomQuotaData(data);
                sponsorshipData.siscom_data = data;
                sponsorshipData.priorityDate = this.calculatePriorityDate(sponsorshipData);
                resolve();
            });
        });
    }
    else {
        return new Promise((resolve) => {
            resolve();
        });
    }
}


module.exports = {
    validateSponsorshipType: _validateSponsorshipType,
    queryRecentSponsorships: _queryRecentSponsorships,
    search: _search,
    get: _get,
    getAllAttachments: _getAllAttachments,
    addAttachment: _addAttachment,
    updateAttachentHandler: _updateAttachentHandler
};

const log = require('../helpers/log').logger;
const _ = require('lodash');
const moment = require('moment');
const bodybuilder = require('bodybuilder');
const SISCOM_PLANS = 'siscom_plans';
const PLAN_TYPE = 'siscom_plan';
const EXCLUDED_EXHIBITORS = ["sup", "val", "aca"];
const es = require('../helpers/esOperation');

let _getSiscomPlans = (initials, marketType) => {

    log.debug('SiscomPlanController -> getSiscomPlans');

    const bob = bodybuilder();

    bob.sort('purchaseLimitEnd', 'desc');
    bob.query('match', 'programInitials', initials);

    if (marketType !== null && typeof marketType !== "undefined") {
        bob.andQuery('match', 'marketType', marketType);
    }

    return es.search({
        index: SISCOM_PLANS,
        type: PLAN_TYPE,
        body: bob.from(0).size(40).build()
    }).then(result => result.hits.hits.map((value) => {
        const quotaQuantity = _.keys(_.groupBy(value._source.quotas, f => f.number)).length;
        return _.assign(value._source, {quotaQuantity});
    }));
};

let _getSiscomAvailablePlans = (initials, marketType) => {

    // log.debug('SiscomPlanController -> getSiscomPlans');

    const bob = bodybuilder();

    bob.sort('purchaseLimitEnd', 'desc');
    bob.query('match', 'programInitials', initials);
    bob.query('match', 'status', 2);

    if (marketType !== null && typeof marketType !== "undefined") {
        bob.andQuery('match', 'marketType', marketType);
    }

    return es.search({
        index: SISCOM_PLANS,
        type: PLAN_TYPE,
        body: bob.from(0).size(40).build()
    }).then(result => result.hits.hits.map((value) => {
        const quotaQuantity = _.keys(_.groupBy(value._source.quotas, f => f.number)).length;
        return _.assign(value._source, {quotaQuantity});
    }));
};

let _getSiscomPlan = (id) => {

    log.debug('SiscomPlanController -> getSiscomPlan');

    if (id === null && typeof id === "undefined") {
        return {"quotas": []};
    }

    return es.get({
        index: SISCOM_PLANS,
        type: PLAN_TYPE,
        id: id
    }).then(result => {
        const quotaQuantity = _.keys(_.groupBy(result._source.quotas, f => f.number)).length;
        return _.assign(result._source, {quotaQuantity});
    });
};

let _dataTransformation = (quotaSource, availableQuotas) => {

    log.debug('SiscomPlanController -> dataTransformation');

    return _.map(_.groupBy(quotaSource.quotas, g => g.exhibitedAt), (quotas) => {
        const locationData = {};

        locationData.availableQuota = [];
        locationData.soldQuota = [];

        _.map(_.groupBy(quotas, q => q.number), quotaNumberArray => {
            // Consideração somente da última cota, tendo em vista que os outros valores são de patrocinadores anteriores
            let quotaInformation = _.orderBy(quotaNumberArray, 'exhibitionEnd', 'asc');
            let lastQuota = _.takeRight(quotaInformation)[0];
            locationData.location = lastQuota.exhibitedAt;

            let renewLimit = null;
            let exhibitionStart = null;
            let exhibitionEnd = null;

            if (lastQuota.exhibitionStart !== null) {
                exhibitionStart = moment(lastQuota.exhibitionStart).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            }

            if (lastQuota.exhibitionEnd !== null) {
                exhibitionEnd = moment(lastQuota.exhibitionEnd).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            }

            if (lastQuota.renewLimit !== null) {
                renewLimit = moment(lastQuota.renewLimit).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            }

            if (_isQuotaSold(lastQuota.clientName)) {
                // Eventualmente teremos os clientes que estão na fila (queuedClients)
                locationData.soldQuota.push({
                    "clientName": lastQuota.clientName,
                    "number": lastQuota.number,
                    "renewLimit": renewLimit,
                    "exhibitionStart": exhibitionStart,
                    "exhibitionEnd": exhibitionEnd,
                    "availability": lastQuota.availability === 0,
                    "queuedClients": [],
                    "queue": lastQuota.queue
                });

                // Precisamos verificar se há disponibilidade para venda por causa do prazo de renovação
                if (_checkRenewLimitForAvailability(lastQuota.renewLimit)) {
                    _defineAsAvailable(quotaSource, lastQuota.exhibitedAt);
                }
            } else {
                locationData.availableQuota.push(lastQuota.number);
                availableQuotas[lastQuota.number - 1] = true;
            }

            locationData.hasQueue = lastQuota.queue > 0;
        });

        return locationData;
    });
};


let _fixSiscomQuotaData = (quotaData) => {

    log.debug('SiscomPlanController -> fixSiscomQuotaData');

    const finalData = {};
    finalData.quotas = [];

    let availableQuotas = [];
    const quotaSource = quotaData;

    // Agrupamento de cotas por exibidora para contagem de acordo com o número
    let quotaQuantity = _.uniq(_.map(quotaSource.quotas, m => {
        return m.number
    })).length;

    quotaSource.quotas = quotaSource.quotas.filter((value) => {
        return !_isExcludedExhibitor(value.exhibitedAt);
    });

    finalData.quotas = _dataTransformation(quotaSource, availableQuotas);
    finalData.quotas = _.orderBy(finalData.quotas, ['availableQuota.length', 'location'], ["desc", "asc"]);

    finalData.marketType = quotaSource.marketType;
    finalData.updatedAt = moment(quotaSource.updatedAt).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    finalData.purchaseLimitStart = moment(quotaSource.purchaseLimitStart).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    finalData.purchaseLimitEnd = moment(quotaSource.purchaseLimitEnd).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

    finalData.availabilityStart = moment(quotaSource.availabilityStart).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    finalData.availabilityEnd = moment(quotaSource.availabilityEnd).utcOffset(0, true).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

    finalData.queueCode = quotaSource.queueCode;
    finalData.purchaseStatus = quotaSource.purchaseStatus;
    finalData.status = quotaSource.status;
    finalData.availableExhibitors = quotaSource.availableExhibitors;
    finalData.queueExhibitors = quotaSource.queueExhibitors;
    finalData.unavailableExhibitors = quotaSource.unavailableExhibitors;
    finalData.isAvailable = quotaSource.isAvailable === 0;

    let availableQuotaCount = availableQuotas.reduce((p, c) => {
        return c === true ? p + 1 : p
    }, 0);

    _.assign(finalData,
        {availableQuotas: availableQuotaCount},
        {soldQuotas: quotaQuantity - availableQuotaCount}
    );

    return finalData;
};

let _checkRenewLimitForAvailability = (renewLimit) => {

    log.debug('SiscomPlanController -> checkRenewLimitForAvailability');

    if (renewLimit === null || typeof renewLimit === "undefined") {
        return false;
    }

    // Se a data de renovação for menor que a data atual
    return +moment().toDate() > +moment(renewLimit).toDate();
};

let _defineAsAvailable = (quotaSource, exhibitedAt) => {

    log.debug('SiscomPlanController -> defineAsAvailable');

    let queueExhibitorIndex = quotaSource.queueExhibitors.indexOf(exhibitedAt);
    if (queueExhibitorIndex > -1) {
        quotaSource.queueExhibitors.splice(queueExhibitorIndex, 1);
    }

    let unavailableExhibitorIndex = quotaSource.unavailableExhibitors.indexOf(exhibitedAt);
    if (unavailableExhibitorIndex > -1) {
        quotaSource.unavailableExhibitors.splice(unavailableExhibitorIndex, 1);
    }

    quotaSource.availableExhibitors.push(exhibitedAt);
};

let _isQuotaSold = (clientName) => {

    log.debug('SiscomPlanController -> isQuotaSold');

    return clientName !== null && typeof clientName !== "undefined" && clientName !== "";
};

let _calculateEarliestPriorityDate = (siscomData) => {

    log.debug('SiscomPlanController -> calculateEarliestPriorityDate');

    // Se o siscom_data não estiver disponível, não podemos fazer nada.
    if (siscomData === null) {
        return null;
    }

    // A regra é que se houver prazo de renovação, temos que usar o mais novo. Se não houver a informação, usar a data de exibição final
    if (!!siscomData && siscomData.quotas.length > 0) {
        let quotasRenewLimit = _.map(siscomData.quotas, c => {
            let renewLimit = null;
            let exhibitionEnd = null;

            if (!!c.renewLimit) {
                renewLimit = new Date(c.renewLimit).getTime()
            }
            if (!!c.exhibitionEnd) {
                exhibitionEnd = new Date(c.exhibitionEnd).getTime()
            }

            if (renewLimit === null && exhibitionEnd !== null) {
                return exhibitionEnd;
            }
            else if (renewLimit !== null && exhibitionEnd === null) {
                return renewLimit;
            }

            if (renewLimit > exhibitionEnd) {
                return exhibitionEnd;
            }
            else if (renewLimit < exhibitionEnd) {
                return renewLimit;
            }
            else if (renewLimit === exhibitionEnd) {
                return renewLimit;
            }
            else {
                return null;
            }
        });

        let renewLimits = _.compact(_.orderBy(quotasRenewLimit, (element) => {
            return element
        }, "asc"));

        // If first value is null, everyone is null!
        if (renewLimits[0] === null) {
            return null;
        }

        if (renewLimits.length === 1) {
            return moment.utc(renewLimits[0]).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        }

        let today = new Date().getTime();

        for (let index = 0; index < renewLimits.length; index++) {
            let element = renewLimits[index];

            if (element >= today) {
                return moment.utc(element).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            }
            if (element === null) {
                return moment.utc(renewLimits[index - 1]).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
            }
        }

        let result = moment.utc(renewLimits[renewLimits.length - 1]).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
        return result === "Invalid date" ? null : result;
    }
};

let _isExcludedExhibitor = (exhibitor) => {
    log.debug('SiscomPlanController -> isExcludedExhibitor');
    return EXCLUDED_EXHIBITORS.indexOf(exhibitor.toLowerCase()) !== -1;
};


module.exports = {
    getSiscomPlans : _getSiscomPlans,
    getSiscomAvailablePlans : _getSiscomAvailablePlans,
    getSiscomPlan : _getSiscomPlan,
    fixSiscomQuotaData : _fixSiscomQuotaData,
    calculateEarliestPriorityDate : _calculateEarliestPriorityDate
};
const log = require('../helpers/log').logger;
const _ = require('lodash');
const httpHelper = require('../helpers/http');
const moment = require('moment');

// Business
const ActivityBusiness = require('./activity');
const AttachmentBusiness = require('./attachments');

//Controllers
const priceTableController = require('../controllers/SiscomPriceTableController');
const siscomProgramController = require('../controllers/SiscomProgramController');
const siscomPlanController = require('../controllers/siscomPlan');
const netSponsorshipController = require('../controllers/net_sponsorship');

function NetSponsorshipBusiness(scope) {
    this.scope = scope;
    Object.assign(NetSponsorshipBusiness.prototype, ActivityBusiness.prototype);
    Object.assign(NetSponsorshipBusiness.prototype, AttachmentBusiness.prototype);
}


NetSponsorshipBusiness.prototype.checkGetReq = function (req) {
    log.info('NetSponsorshipBusiness -> checkGetReq');

    return new Promise((resolve, reject) => {

        if (req.query.initials === null || typeof req.query.initials === "undefined") {
            reject({type: "validateNetSponsorshipInitials"});
        }

        if (req.query.start_date === null || typeof req.query.start_date === "undefined") {
            reject({type: "validateNetSponsorshipStartDate"});
        }

        if (req.query.end_date === null || typeof req.query.end_date === "undefined") {
            reject({type: "validateNetSponsorshipEndDate"});
        }

        resolve(this.scope);

    })
};


NetSponsorshipBusiness.prototype.checkExhibitors = function (req) {
    log.info('NetSponsorshipBusiness -> checkExhibitors');

    return new Promise((resolve) => {

        this.scope.exhibitorData = [];

        if (req.query.exhibitors !== null && typeof req.query.exhibitors !== "undefined") {
            this.scope.exhibitorData = req.query.exhibitors.length > 0 ? _.split(req.query.exhibitors, ",") : [];
        }

        resolve(this.scope);

    })
};

NetSponsorshipBusiness.prototype.calibrateStartDate = function (req) {
    log.info('NetSponsorshipBusiness -> calibrateStartDate');
    return new Promise((resolve) => {
        let startDate = req.query.start_date;
        this.scope.startDate = priceTableController.calibrateStartDate(startDate);
        resolve(this.scope);
    })
};

NetSponsorshipBusiness.prototype.queryPriceTable = function (req) {
    log.info('NetSponsorshipBusiness -> queryPriceTable');
    return new Promise((resolve, reject) => {
        priceTableController.queryPriceTable(this.scope.startDate, req.query.end_date, req.query.initials, this.scope.exhibitorData)
            .then((data) => {
                this.scope.resultQueryPriceTable = data;
                resolve(this.scope);
            }).catch((err) => reject({type: "queryPriceTable", err: err}))
    })
};


NetSponsorshipBusiness.prototype.getSiscomPlans = function (req) {
    log.info('NetSponsorshipBusiness -> getSiscomPlans');
    return new Promise((resolve, reject) => {
        let initials = req.query.initials;
        siscomPlanController.getSiscomPlans(initials.toLowerCase(), "L")
            .then((data) => {
                _.assign(this.scope.parsedResponse, {"quotaQuantity": data.length > 0 ? data[0].quotaQuantity : 0});
                resolve(this.scope);
            }).catch((err) => reject({type: "getSiscomPlans", err: err}))
    })
};


NetSponsorshipBusiness.prototype.groupPricesByCompetence = function (req) {
    log.info('NetSponsorshipBusiness -> groupPricesByCompetence');
    return new Promise((resolve) => {
        this.scope.parsedResponse = {};
        _.assign(this.scope.parsedResponse, {"priceTable": priceTableController.groupPricesByCompetence(this.scope.resultQueryPriceTable, req.query.initials)});
        resolve(this.scope);
    })
};


NetSponsorshipBusiness.prototype.getProgramIndex = function (req) {
    log.info('NetSponsorshipBusiness -> getProgramIndex');
    return new Promise((resolve) => {
        let initials = req.query.initials;
        _.assign(this.scope.parsedResponse, {
            "conversionIndex": priceTableController.getProgramIndex(initials),
            "programId": this.scope.resultQueryProgramData[0].Id,
            "programGender": this.scope.resultQueryProgramData[0].Gender,
            "name": this.scope.resultQueryProgramData[0].Name,
            "weekDays": this.scope.resultQueryProgramData[0].PresentationDays,
            "startTime": moment(this.scope.resultQueryProgramData[0].StartTime, moment.ISO_8601).format("HH:mm")
        });
        resolve(this.scope);
    })
};

NetSponsorshipBusiness.prototype.queryProgramData = function (req) {
    log.info('NetSponsorshipBusiness -> queryProgramData');
    return new Promise((resolve, reject) => {
        siscomProgramController.queryProgramData(req.query.initials.toLowerCase())
            .then((data) => {
                if (data.length === 0) {
                    reject({type: "queryProgramDataNotFound"});
                } else {
                    this.scope.resultQueryProgramData = data;
                    resolve(this.scope)
                }
            }).catch((err) => reject({type: "queryProgramData", err: err}))
    })
};


NetSponsorshipBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info('NetSponsorshipBusiness -> enviarResposta');
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};


NetSponsorshipBusiness.prototype.updateAttachentHandler = function (req) {
    log.info('NetSponsorshipBusiness -> updateAttachentHandler');
    return new Promise((resolve, reject) => {
        netSponsorshipController.updateAttachentHandler({
            project_id: req.params.id,
            attachment: req.params.attachment,
        })
            .then(() => resolve(this.scope))
            .catch((err) => reject({type: "updateAttachentHandler", err: err}));

    })
};


NetSponsorshipBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        case 'validateNetSponsorshipInitials':
            httpHelper.responseBadRequest(res, {"message": "Initials are mandatory."});
            break;
        case 'validateNetSponsorshipStartDate':
            httpHelper.responseBadRequest(res, {"message": "start_date is mandatory."});
            break;
        case 'validateNetSponsorshipEndDate':
            httpHelper.responseBadRequest(res, {"message": "end_date is mandatory."});
            break;
        case 'queryProgramDataNotFound':
            httpHelper.notFoundResponse(res);
            break;
        default:
            httpHelper.errorResponse(res);
    }
};


module.exports = NetSponsorshipBusiness;
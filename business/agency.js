const httpHelper = require('../helpers/http');
const agencyController = require('../controllers/agency');
const log = require('../helpers/log').logger;
const _ = require('lodash');

function AgencyBusiness(scope) {
    this.scope = scope;
}

AgencyBusiness.prototype.getAllAgencies = function () {
    log.info('AgencyBusiness -> getAllAgencies');
    return new Promise((resolve, reject) => {
        agencyController.getAllAgencies().then((results) => {
            this.scope.agencies = results;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAllAgencies", err: err}))
    });
};

AgencyBusiness.prototype.getAgencyById = function (req) {
    log.info('AgencyBusiness -> getAgencyById');
    return new Promise((resolve, reject) => {
        agencyController.getAgencyById(req).then(queryResult => {
            this.scope.agencies = queryResult;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAgencyById", err: err}))
    });
};

AgencyBusiness.prototype.getAgencyByName = function (req) {
    log.info('AgencyBusiness -> getAgencyByName');
    return new Promise((resolve, reject) => {
        agencyController.getAgencyByName(req).then(queryResult => {
            this.scope.agencies = queryResult;
            //this.scope.query = req.query;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAgencyByName", err: err}))
    });
};

AgencyBusiness.prototype.getAgenciesByAccountId = function (req) {
    log.info('AgencyBusiness -> getAgenciesByAccountId');
    return new Promise((resolve, reject) => {
        agencyController.getAgenciesByAccountId(req).then(queryResult => {
            this.scope.agencies = queryResult;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAgenciesByAccountId", err: err}))
    });
};

AgencyBusiness.prototype.getAgenciesInAccount = function () {
    log.info('AgencyBusiness -> getAgenciesInAccount');
    return new Promise((resolve, reject) => {
        agencyController.getAgenciesInAccount(this.scope.agencies).then(queryResult => {
            this.scope.agencies = queryResult;
            //this.scope.query = req.query;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAgenciesInAccount", err: err}))
    });
};

AgencyBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        case 'getAllAgencies':
            httpHelper.badRequestResponse(res, "Agências não encontradas")
            break;
        case 'getAgencyById':
        case 'getAgencyByName':
            httpHelper.badRequestResponse(res, "Agência não encontrada")
            break;
        case 'getAgenciesInAccount':
        case 'getAgenciesByAccountId':
            httpHelper.badRequestResponse(res, "Não foram encontradas agências para esse anunciante")
            break;
        default:
            httpHelper.errorResponse(res);
    }
};

AgencyBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info('AgencyBusiness -> enviarResposta');
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

module.exports = AgencyBusiness;
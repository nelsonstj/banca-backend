const httpHelper = require('../helpers/http');
const crmEntityController = require('../controllers/crmEntity');
const log = require('../helpers/log').logger;
const _ = require('lodash');

function CrmEntityBusiness(scope) {
    this.scope = scope;
}

CrmEntityBusiness.prototype.getAllEntity = function (req) {
    log.info('CrmEntityBusiness -> getAllEntity');
    return new Promise((resolve, reject) => {
        crmEntityController.getAllEntity(req).then((results) => {
            this.scope.entity = results;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAllEntity", err: err}))
    });
};

CrmEntityBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        default:
            httpHelper.errorResponse(res);
    }
};

CrmEntityBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info('CrmEntityBusiness -> enviarResposta');
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

module.exports = CrmEntityBusiness;
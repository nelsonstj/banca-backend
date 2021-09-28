const log = require('../helpers/log').logger;
const _ = require('lodash');
const httpHelper = require('../helpers/http');
const moment = require('moment');

const integracao = require('../helpers/integration');

function IntegrationBusiness(scope) {
    this.scope = scope;
}

IntegrationBusiness.prototype.integracaoEnviar = function (body) {
    log.info('IntegrationBusiness -> integracaoEnviar');
    return new Promise((resolve, reject) => {
        integracao.enviar(body)
        .then((scope) => { resolve(this.scope) })
        .catch((err) => reject({type: "integracaoEnviar", err: err}));
      });
};

IntegrationBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info('IntegrationBusiness -> enviarResposta');
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

IntegrationBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        default:
            httpHelper.errorResponse(res);
    }
};

module.exports = IntegrationBusiness;
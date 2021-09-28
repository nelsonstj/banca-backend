const httpHelper = require('../helpers/http');
const log = require('../helpers/log').logger;

// Controllers
const indiceController = require('../controllers/indice');

// Business
const AttachmentBusiness = require('./attachments');

function IndiceBusiness(scope) {
  this.scope = scope;
  Object.assign(IndiceBusiness.prototype, AttachmentBusiness.prototype);
}

IndiceBusiness.prototype.conversion = function () {
  log.info('IndiceBusiness -> conversion');
  return new Promise((resolve, reject) => {
    indiceController
      .corversion(this.scope.attachmentURL)
      .then(() => {
        resolve(this.scope);
      })
      .catch((err) => {
        reject({ type: 'conversion', err });
      });
  });
};

IndiceBusiness.prototype.enviarResposta = function (res, status, msg) {
  log.info('IndiceBusiness -> enviarResposta');
  return new Promise((resolve) => {
    res.status(status).json(msg);
    resolve(this.scope);
  });
};

IndiceBusiness.prototype.getIndexConversao = function ({ bucket }) {
  log.info('IndiceBusiness -> getIndexConversao');
  return new Promise((resolve, reject) => {
    const _extensoes = ['csv', 'xls', 'xlsx'];
    const _arquivos = _extensoes.map(extensao => `indice-de-conversao.${extensao}`);
    this.getAttachmentURLWithCheck({ bucket, attachment: _arquivos[0] })
      .then(() => resolve(this.scope))
      .catch(err => log.error(err))
      .then(() =>
        this.getAttachmentURLWithCheck({ bucket, attachment: _arquivos[1] })
          .then(() => resolve(this.scope))
          .catch(err => log.error(err))
      )
      .then(() =>
        this.getAttachmentURLWithCheck({ bucket, attachment: _arquivos[2] })
          .then(() => resolve(this.scope))
          .catch(err => log.error(err))
      )
      .catch(err => reject({ type: 'getIndexConversao', err }));
  });
};

IndiceBusiness.prototype.errorHandler = function (err, res) {
  log.error(err);
  switch (err.type) {
    default:
      httpHelper.errorResponse(res);
  }
};

module.exports = IndiceBusiness;

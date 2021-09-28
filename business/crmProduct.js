const httpHelper = require('../helpers/http');
const crmProductController = require('../controllers/crmProduct');
const log = require('../helpers/log').logger;
const _ = require('lodash');

function CrmProductBusiness(scope) {
  this.scope = scope;
}

CrmProductBusiness.prototype.getAllProducts = function () {
  log.info('CrmProductBusiness -> getAllProducts');
  return new Promise((resolve, reject) => {
    crmProductController.getAllProducts().then(results => {
      this.scope.products = results;
      resolve(this.scope);
    }).catch((err) => reject({type: "getAllProducts", err: err}))
  });
};

CrmProductBusiness.prototype.getProductById = function (req) {
  log.info('CrmProductBusiness -> getProductById');
  return new Promise((resolve, reject) => {
    crmProductController.getProductById(req).then(result => {
      this.scope.product = result;
      resolve(this.scope);
    }).catch((err) => reject({type: "getProductById", err: err}))
  });
};

CrmProductBusiness.prototype.getProductByName = function (req) {
  log.info('CrmProductBusiness -> getProductByName');
  return new Promise((resolve, reject) => {
    crmProductController.getProductByName(req).then(result => {
      this.scope.products = result;
      resolve(this.scope);
    }).catch((err) => reject({type: "getProductByName", err: err}))
  });
};

CrmProductBusiness.prototype.getProductToOpportunity = function (productId) {
  log.info('CrmProductBusiness -> getProductToOpportunity');
  return new Promise((resolve, reject) => {
    crmProductController.getProductToOpportunity(productId).then(result => {
      this.scope.products = result;
      resolve(this.scope);
    }).catch((err) => reject({type: "getProductToOpportunity"}))
  });
};

CrmProductBusiness.prototype.errorHandler = function (err, res) {
  log.error(err);
  switch (err.type) {
    case 'getUserCrm':
      httpHelper.unauthorizedResponse(res, "Usuário não está cadastrado no GO! CRM");
      break;
    case 'getUserCrmRoles':
      httpHelper.unauthorizedResponse(res, "Usuário não tem permissão para criar ofertas no GO! CRM");
      break;
    case 'getProductById':
      httpHelper.badRequestResponse(res, "Produto não encontrado no CRM ou sem associação com o Siscom.");
      break;
    case 'getProductToOpportunity':
      httpHelper.badRequestResponse(res, "Produto não encontrado no CRM ou sem associação com o Siscom.");
      break;
    default:
      httpHelper.errorResponse(res);
  }
};

CrmProductBusiness.prototype.enviarResposta = function (res, status, msg) {
  log.info('CrmProductBusiness -> enviarResposta');
  return new Promise((resolve) => {
    res.status(status).json(msg);
    resolve(this.scope);
  })
};

module.exports = CrmProductBusiness;

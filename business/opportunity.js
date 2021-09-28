const httpHelper = require("../helpers/http");
const opportunityController = require("../controllers/opportunity");
const log = require("../helpers/log").logger;
const _ = require("lodash");
const UserBusiness = require("./user");
const CrmProductBusiness = require("./crmProduct");

function OpportunityBusiness(scope) {
  this.scope = scope;
  Object.assign(OpportunityBusiness.prototype, UserBusiness.prototype);
  Object.assign(OpportunityBusiness.prototype, CrmProductBusiness.prototype);
}

OpportunityBusiness.prototype.createOpportunity = function(req) {
  log.info("OpportunityBusiness -> createOpportunity");
  return new Promise((resolve, reject) => {
    opportunityController.createOpportunity({
      data: req.body,
      product: this.scope.products,
      usercrm: this.scope.usercrm
    })
    .then(result => {
      this.scope.opportunity = result;
      resolve(this.scope);
    })
    .catch(err => reject({ type: "createOpportunity", err: err }));
  });
};

OpportunityBusiness.prototype.createOpportunityProduct = function(req) {
  log.info("OpportunityBusiness -> createOpportunityProduct");
  return new Promise((resolve, reject) => {
    opportunityController.createOpportunityProduct({
      data: req.body,
      product: this.scope.products,
      opportunity: this.scope.opportunity
    })
    .then(() => {
      this.scope.opportunity.msg = "Oferta criada com sucesso!";
      resolve(this.scope);
    })
    .catch(err => reject({ type: "createOpportunityProduct", err: err }));
  });
};

OpportunityBusiness.prototype.getOpportunitiesCount = function (main_type) {
  log.info('OpportunityBusiness -> getOpportunitiesCount main_type:', main_type);
  return new Promise((resolve, reject) => {
    opportunityController.getOpportunitiesCount(main_type).then((results) => {
      this.scope.counts = results;
      resolve(this.scope);
    }).catch((err) => reject({ type: "getOpportunitiesCount", err: err }))
  });
};

OpportunityBusiness.prototype.getAllOpportunitiesCount = function (source) {
  log.info('OpportunityBusiness -> getAllOpportunitiesCount');
  return new Promise((resolve, reject) => {
    opportunityController.getAllOpportunitiesCount(source).then((results) => {
      this.scope.counts = results;
      resolve(this.scope);
    }).catch((err) => reject({ type: "getAllOpportunitiesCount", err: err }))
  });
};

OpportunityBusiness.prototype.getOpportunitiesCountByProduct = function (query) {
  log.info('OpportunityBusiness -> getOpportunitiesCountByProduct query:', query);
  return new Promise((resolve, reject) => {
    opportunityController.getOpportunitiesCountByProduct(query).then((results) => {
      this.scope.counts = results;
      resolve(this.scope);
    }).catch((err) => reject({ type: "getOpportunitiesCountByProduct", err: err }))
  });
};

OpportunityBusiness.prototype.errorHandler = function(err, res) {
  log.error(err);
  switch (err.type) {
    case 'getUserCrm':
      httpHelper.unauthorizedResponse(res, "Usuário não está cadastrado no GO! CRM");
      break;
    case 'getUserCrmRoles':
      httpHelper.unauthorizedResponse(res, "Usuário não tem permissão para criar ofertas no GO! CRM");
      break;
    case 'getOpportunitiesCount':
      httpHelper.badRequestResponse(res, "Erro ao obter a quantidade de ofertas criadas");
      break;
    case 'getAllOpportunitiesCount':
      httpHelper.badRequestResponse(res, "Erro ao obter a quantidade de ofertas criadas");
      break;
    default:
      httpHelper.errorResponse(res);
  }
};

OpportunityBusiness.prototype.enviarResposta = function(res, status, msg) {
  log.info("OpportunityBusiness -> enviarResposta");
  return new Promise((resolve) => {
    res.status(status).json(msg);
    resolve(this.scope);
  });
};

module.exports = OpportunityBusiness;

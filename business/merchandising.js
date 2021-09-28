const httpHelper = require("../helpers/http");
const merchandisingController = require("../controllers/merchandising");
const log = require("../helpers/log").logger;
const _ = require("lodash");
const UserBusiness = require("./user");
const AttachmentBusiness = require('./attachments');

function MerchandisingBusiness(scope) {
  this.scope = scope;
  Object.assign(MerchandisingBusiness.prototype, UserBusiness.prototype);
  Object.assign(MerchandisingBusiness.prototype, AttachmentBusiness.prototype);
}

MerchandisingBusiness.prototype.checkGetReq = function(req) {
  log.info('MerchandisingBusiness -> checkGetReq');
  return new Promise((resolve, reject) => {
    if (!req.query.type && !req.query.genre && !req.query.period_start_exhib && !req.query.period_end_exhib) {
      log.info('MerchandisingBusiness -> checkGetReq -> reject');
      reject({ type: "validateSearchMerchandising" });
    } else {
      log.info('MerchandisingBusiness -> checkGetReq -> resolve');
      resolve(this.scope);
    }
  })
};

MerchandisingBusiness.prototype.createMerchandising = function(req) {
  log.info("MerchandisingBusiness -> createMerchandising");
  return new Promise((resolve, reject) => {
    merchandisingController.createMerchandising({ 
      merchandising: req.body,
      user: this.scope.user
    })
    .then(() => {
      this.scope.merchandising.msg = "Merchandising criado com sucesso!";
      resolve(this.scope);
    })
    .catch((err) => { reject({ type: "createMerchandising", err: err }); });
  });
};

MerchandisingBusiness.prototype.getAllMerchandisings = function () {
  log.info('MerchandisingBusiness -> getAllMerchandisings');
  return new Promise((resolve, reject) => {
    merchandisingController.getAllMerchandisings()
    .then((results) => {
      this.scope.merchandisings = results;
      resolve(this.scope);
    })
    .catch((err) => { reject({ type: "getAllMerchandisings", err: err }); });
  });
};

MerchandisingBusiness.prototype.getMerchandisingById = function (req) {
  log.info('MerchandisingBusiness -> getMerchandisingById');
  return new Promise((resolve, reject) => {
    merchandisingController.getMerchandisingById(req)
    .then((results) => {
      this.scope.merchandising = results;
      resolve(this.scope);
    })
    .catch((err) => { reject({ type: "getMerchandisingById", err: err }); });
  });
};

MerchandisingBusiness.prototype.getMerchandisingsByTitle = function (req) {
  log.info('MerchandisingBusiness -> getMerchandisingsByTitle');
  return new Promise((resolve, reject) => {
    merchandisingController.getMerchandisingsByTitle(req)
    .then(queryResult => {
      this.scope.merchandisings = queryResult;
      resolve(this.scope);
    })
    .catch((err) => { reject({ type: "getMerchandisingsByTitle", err: err }); });
  });
};

MerchandisingBusiness.prototype.getMerchandisingsBySearch = function (req) {
  log.info('MerchandisingBusiness -> getMerchandisingsBySearch');
  return new Promise((resolve, reject) => {
    if (!req.query.type && !req.query.genre && !req.query.period_start_exhib && !req.query.period_end_exhib && 
        !req.query.title_description && !req.query.published && !req.query.order_by) {
      reject({ type: "validateSearchNull" });
    } else if (req.query.period_end_exhib < req.query.period_start_exhib) {
      reject({ type: "validateSearchDate" });
    } else if (req.query.order_by && allOrders.indexOf(req.query.order_by) === -1) {
      reject({ type: "validateSearchOrder" });
    } else if (req.query.order_type && allOrdersType.indexOf(req.query.order_type) === -1) {
      reject({ type: "validateSearchOrderType" });
    } else {
      merchandisingController.getMerchandisingsBySearch(req)
      .then((queryResult) => {
        this.scope.merchandisings = queryResult;
        resolve(this.scope);
      })
      .catch((err) => { reject({ type: err.type, err: err }); });
    }
  });
};

MerchandisingBusiness.prototype.enviarRespostaMerchandisingBusiness = function(res, status, msg) {
  log.info("MerchandisingBusiness -> enviarResposta");
  return new Promise((resolve) => {
    res.status(status).json(msg);
    resolve(this.scope);
  });
};

MerchandisingBusiness.prototype.errorHandlerMerchandisingBusiness = function(err, res) {
  log.error('MerchandisingBusiness -> Erro');
  switch (err.type) {
    case 'getAllMerchandisings':
      httpHelper.badRequestResponse(res, "Error getting all merchandisings!");
      break;
    case 'getMerchandisingsBySearch':
      httpHelper.badRequestResponse(res, err.msg);
      break;
    case 'getMerchandisingsByIdNotFound':
    case 'getMerchandisingsBySearchNotFound':
      httpHelper.notFoundResponse(res);
      break;
    case 'validateSearchNull':
      httpHelper.badRequestResponse(res, "You must enter at least one parameter!");
      break;
    case 'validateSearchDate':
      httpHelper.badRequestResponse(res, "The end date must be greater than the start date!");
      break;
    case 'validateSearchOrder':
    case 'validateSearchOrderType':
      httpHelper.badRequestResponse(res, "The sorting type does not exist!");
      break;
    default:
      httpHelper.errorResponse(res);
  }
};

const allOrders = ['created_at', 'published_at' , 'period_start_exhib'];
const allOrdersType = ['asc', 'desc'];

module.exports = MerchandisingBusiness;

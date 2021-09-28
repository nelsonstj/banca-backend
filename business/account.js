const httpHelper = require('../helpers/http');
const accountController = require('../controllers/account');
const log = require('../helpers/log').logger;
const _ = require('lodash');
const UserBusiness = require("./user");

function AccountBusiness(scope) {
    this.scope = scope;
    Object.assign(AccountBusiness.prototype, UserBusiness.prototype);
}

AccountBusiness.prototype.getAllAccounts = function () {
    log.info('AccountBusiness -> getAllAccounts');
    return new Promise((resolve, reject) => {
        accountController.getAllAccounts().then((results) => {
            //this.scope.nextLink = results.oDataNextLink;
            this.scope.allaccounts = results;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAllAccounts", err: err}))
    });
};

AccountBusiness.prototype.getAllProspects = function () {
  log.info('AccountBusiness -> getAllProspects');
  return new Promise((resolve, reject) => {
    accountController.getAllProspects()
      .then((results) => {
        this.scope.prospects = results;
        resolve(this.scope);
      })
      .catch((err) => reject({ type: "getAllProspects", err: err }))
  });
};

AccountBusiness.prototype.getMyAccounts = function (req) {
  log.info('AccountBusiness -> getMyAccounts');
  return new Promise((resolve, reject) => {
    accountController.getMyAccounts({
      req: req,
      usercrm: this.scope.usercrm
    })
    .then((results) => {
      this.scope.myaccounts = results;
      resolve(this.scope);
    }).catch((err) => reject({ type: "getMyAccounts", err: err }))
  });
};

AccountBusiness.prototype.getPersAccounts = function (req) {
  log.info('AccountBusiness -> getPersAccounts');
  return new Promise((resolve, reject) => {
    let accounts = {
      myaccounts: [],
      prospects: [],
      allaccounts: []
    };
    accounts.myaccounts = this.scope.myaccounts ? this.scope.myaccounts : null;
    accounts.prospects = this.scope.prospects ? _.differenceBy(this.scope.prospects, this.scope.myaccounts, 'accountid') : null;
    accounts.allaccounts = this.scope.allaccounts ? _.differenceBy(this.scope.allaccounts, this.scope.myaccounts, 'accountid') : null;
    accounts.allaccounts = accounts.allaccounts ? _.differenceBy(accounts.allaccounts, this.scope.prospects, 'accountid') : null;
    if (JSON.stringify(accounts) !== '{}') {
      this.scope.accounts = accounts;
      log.info('AccountBusiness -> getPersAccounts -> myaccounts -> count: ', accounts.myaccounts.length);
      log.info('AccountBusiness -> getPersAccounts -> prospects -> count: ', accounts.prospects.length);
      log.info('AccountBusiness -> getPersAccounts -> allaccounts -> count: ', accounts.allaccounts.length);
      resolve(this.scope)
    } else {
      reject({type: "getPersAccounts"})
    }
  });
};

AccountBusiness.prototype.getAccountById = function (req) {
    log.info('AccountBusiness -> getAccountById');
    return new Promise((resolve, reject) => {
        accountController.getAccountById(req).then(queryResult => {
            this.scope.accounts = queryResult;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAccountById", err: err}))
    });
};

AccountBusiness.prototype.getAccountsByName = function (req) {
    log.info('AccountBusiness -> getAccount');
    return new Promise((resolve, reject) => {
        accountController.getAccountsByName(req).then(queryResult => {
            this.scope.accounts = queryResult;
            //this.scope.query = req.query;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAccountByName", err: err}))
    });
};

AccountBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        case 'getAllAccounts':
        case 'getAllProspects':
        case 'getMyAccounts':
        case 'getPersAccounts':
            httpHelper.badRequestResponse(res, "Contas não encontradas")
            break;
        case 'getAccountById':
        case 'getAccountByName':
            httpHelper.badRequestResponse(res, "Conta não encontrada")
            break;
        default:
            httpHelper.errorResponse(res);
    }
};

AccountBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info('AccountBusiness -> enviarResposta');
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

module.exports = AccountBusiness;
const config = require('config');
const log = require('../helpers/log').logger;
const _ = require('lodash');
const crmGo = require('../helpers/crm');
const UserController = require('./user')
const cfgCrmGo = config.get("crmGo"); //config

/**
 * getAll - get all accounts
 *
 * @return {Promise<Array>}  promise containing an array of all accounts
 */
let _getAllAccounts = () => {
    log.debug('AccountsController -> getAllAccounts');
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'accounts',
                select: ['name', 'accountid'],
                filter: 'name ne null' + 
                        ' and ' + 
                        '_tipoconta_value eq '+ cfgCrmGo.tipoPessoaCliente + //cliente
                        ' and ' + 
                        'statecode eq 0',
               orderBy: ['name asc'],
           //maxPageSize: 10,
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('AccountsController getAllAccounts Count: ' + JSON.stringify(records.oDataCount));
            //var nextLink = records.oDataNextLink;
            //console.log('Accounts Request: ' + JSON.stringify(records));
            records.value.forEach(account => {
                res.push({
                    accountid: account.accountid.toUpperCase(),
                    name: account.name.toUpperCase()
                })
            });
            //res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro Accounts: ' + error.message);
            reject(error)
        });
    })
};

/**
 * getAll - get all accounts prospects
 *
 * @return {Promise<Array>}  promise containing an array of all accounts prospects
 */
let _getAllProspects = () => {
    log.debug('AccountController -> getAllProspects');
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'accounts',
                select: ['name', 'accountid'],
                filter: 'name ne null' + 
                        ' and ' + 
                        '_tipoconta_value eq '+ cfgCrmGo.tipoPessoaCliente + //cliente
                        ' and ' + 
                        '_situacao eq 435450000 and statecode eq 0',
                        //435450000 = prospecção; 435450001 = ativo; 435450002 = inativo; 
               orderBy: ['name asc'],
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('AccountController getAllProspects Count: ' + JSON.stringify(records.oDataCount));
            //console.log('AccountController getAllProspects Request: ' + JSON.stringify(records));
            records.value.forEach(account => {
                res.push({
                    accountid: account.accountid.toUpperCase(),
                    name: account.name.toUpperCase()
                })
            });
            //res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro getAllProspects: ' + error.message);
            reject(error)
        });
    })
};

/**
 * getAll - get my accounts
 *
 * @param {string}   req
 *
 * @return {Promise<Array>}  promise containing an array of my accounts
 */
let _getMyAccounts = ({ req, usercrm }) => {
  log.debug('AccountController -> getMyAccounts');
  log.debug('AccountController -> getMyAccounts -> email: ' + JSON.stringify(req.user.email));
  let userGUID = usercrm[0] ? usercrm[0].systemuserid ? usercrm[0].systemuserid : usercrm[0].ownerid : '';
  log.debug('AccountController -> getMyAccounts -> userGUID: ' + JSON.stringify(userGUID));
  let res = [];
  return new Promise((resolve, reject) => {
    var request = '<fetch mapping="logical" distinct="true">' +
                    '<entity name="account" >' +
                      '<attribute name="accountid" />' +
                      '<attribute name="name" />' +
                      '<order attribute="name" descending="false" />' +
                      '<link-entity name="team" from="teamid" to="owningteam" >' +
                        '<link-entity name="teammembership" from="teamid" to="teamid" intersect="true" >' +
                          '<filter>' +
                            '<condition attribute="systemuserid" operator="eq" value="'+ userGUID +'" />' +
                          '</filter>' +
                        '</link-entity>' +
                      '</link-entity>' +
                    '</entity>' +
                  '</fetch>';
    crmGo.dynamicsWebApi.executeFetchXml("accounts", request)
      .then((records) => {
        // log.debug('AccountController getMyAccounts records: ' + JSON.stringify(records));
        records.value.forEach((account) => {
          res.push({
            accountid: account.accountid.toUpperCase(),
            name: account.name.toUpperCase()
          })
        });
        resolve(res);
      })
      .catch((error) => {
        log.error('Erro getMyAccounts: ' + error.message);
        reject(error)
    });
  })
};

/**
 * get - Return an account
 *
 * @param {string}   accountId
 *
 * @return {Promise<>} promise containing account object
 */
let _getAccountById = (req) => {
    log.debug('AccountController -> getAccountById');
    log.debug('AccountController -> getAccountById -> req: ' + JSON.stringify(req.params.id));
    let accountid = req.params.id;
    log.debug('Id: ' + accountid);
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'accounts',
                select: ['name', 'accountid', '_situacao', '_tipoconta_value'],
                filter: 'accountid eq ' + accountid + ' and statecode eq 0',
               orderBy: ['name asc'],
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('AccountController getAccountById Count: ' + JSON.stringify(records.oDataCount));
            //log.debug('Accounts Request: ' + JSON.stringify(records));
            res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro getAccountById: ' + error.message);
            reject(error)
        });
    })
};

/**
 * get - Return an account
 *
 * @param {string}   name
 *
 * @return {Promise<>} promise containing account object
 */
let _getAccountsByName = (req) => {
    log.debug('accountsController -> getAccount');
    //log.debug('AccountController -> getAccountsByName -> req: ' + JSON.stringify(req.query.q));
    let account = req.query.q;
    log.debug('AccountController -> getAccountsByName -> account: ' + account);
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'accounts',
                //select: ['name', 'accountid', '_situacao'],
                filter: 'name ne null' + 
                        ' and ' + 
                        '_tipoconta_value eq '+ cfgCrmGo.tipoPessoaCliente + //cliente
                        ' and ' +
                        "contains(name, '" + account + "') and statecode eq 0 ",
               orderBy: ['name asc'],
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(record => {
            //log.debug('Accounts Search: ' + JSON.stringify(record));
            log.debug('AccountController getAccountsByName Count: ' + JSON.stringify(record.oDataCount));
            res = record.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro getAccountsByName: ' + error.message);
            reject(error)
        });
    })
};

module.exports = {
    getAllAccounts: _getAllAccounts,
    getAllProspects: _getAllProspects,
    getMyAccounts: _getMyAccounts,
    getAccountById: _getAccountById,
    getAccountsByName: _getAccountsByName
};

const config = require('config');
const log = require('../helpers/log').logger;
const _ = require('lodash');
const crmGo = require('../helpers/crm');
const cfgCrmGo = config.get("crmGo"); //config

/**
 * getAll - get all agencies
 *
 * @return {Promise<Array>}  promise containing an array of all agencies
 */
let _getAllAgencies = () => {
    log.debug('AgencyController -> getAllAgencies');
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'accounts',
                select: ['name', 'accountid'],
                filter: '_tvglobo_tipoconta_value eq '+ cfgCrmGo.tipoPessoaAgencia +' and statecode eq 0', // agencia
               orderBy: ['name asc'],
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('AgencyController getAllAgencies Count: ' + JSON.stringify(records.oDataCount));
            //console.log('AgencyController getAllAgencies Request: ' + JSON.stringify(records));
            records.value.forEach(account => {
                res.push({
                    accountid: account.accountid.toUpperCase(),
                    name: account.name.toUpperCase()
                })
            });
            //res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro getAllAgencies: ' + error.message);
            reject(error)
        });
    })
};

/**
 * get - Return an agency
 *
 * @param {string}   name
 *
 * @return {Promise<>} promise containing agency object
 */
let _get = ({scope}) => {
    log.debug('AgencyController -> get');
    let _name = JSON.stringify(scope);
    log.debug('Name: ' + _name);
    let res = [];
    return new Promise((resolve, reject) => {
        crmGo.dynamicsWebApi.retrieve(_name, 'accounts', ['name', 'accountid']).then(records => {
            log.debug('AgencyController Count: ' + JSON.stringify(records.oDataCount));
            //console.log('Accounts Request: ' + JSON.stringify(records));
            res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro Accounts: ' + error.message);
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
let _getAgencyById = (req) => {
    log.debug('AgencyController -> getAgencyById');
    //log.debug('AgencyController -> getAgencyById -> req: ' + JSON.stringify(req.params.id));
    let accountid = req.params.id;
    //log.debug('Id: ' + accountid);
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'accounts',
                select: ['name', 'accountid'],
                filter: 'name ne null' + 
                        ' and ' + 
                        '_tvglobo_tipoconta_value eq '+ cfgCrmGo.tipoPessoaAgencia + //agencia
                        ' and ' +
                        'accountid eq ' + accountid + ' and statecode eq 0',
               orderBy: ['name asc'],
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(records => {
            log.debug('AgencyController getAgencyById Count: ' + JSON.stringify(records.oDataCount));
            //log.debug('AgencyController getAgencyById Request: ' + JSON.stringify(records));
            records.value.forEach(account => {
                res.push({
                    accountid: account.accountid.toUpperCase(),
                    name: account.name.toUpperCase()
                })
            });
            //res = records.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro getAgencyById: ' + error.message);
            reject(error)
        });
    })
};

/**
 * get - Return an agency
 *
 * @param {string}   name
 *
 * @return {Promise<>} promise containing agency object
 */
let _getAgencyByName = (req) => {
    log.debug('AgencyController -> getAgencyByName -> req: ' + JSON.stringify(req.query.q));
    let accountName = req.query.q;
    //log.debug('AgencyController -> getAgencyByName -> req: ' + req);
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'accounts',
                select:  ['name', 'accountid'],
                filter: 'name ne null' + 
                        ' and ' + 
                        '_tvglobo_tipoconta_value eq '+ cfgCrmGo.tipoPessoaAgencia + //agencia
                        ' and ' +
                        "contains(name, '" + accountName + "') and statecode eq 0 ",
               orderBy: ['name asc'],
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request)
            .then(records => {
                log.debug('AgencyController getAgencyByName Search: ' + JSON.stringify(records));
                records.value.forEach(account => {
                    res.push({
                        accountid: account.accountid.toUpperCase(),
                        name: account.name.toUpperCase()
                    })
                });
                //res = records.value;
                resolve(res);
            })
            .catch(error => {
                log.error('Erro getAgencyByName: ' + error.message);
                reject(error)
        });
    })
};

/**
 * get - Return an agency
 *
 * @param {string}   accountId
 *
 * @return {Promise<>} promise containing agency object
 */
let _getAgenciesByAccountId = (req) => {
    log.info('AgencyController -> getAgenciesByAccountId');
    log.debug('AgencyController -> getAgenciesByAccountId -> req: ' + JSON.stringify(req.params.accountid));
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: 'connections',
                select: ['_record1id_value', '_record2id_value', 'name'],
                filter: '_record2id_value eq ' + req.params.accountid + ' and statecode eq 0',
               orderBy: ['name asc'],
                 count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request)
            .then(records => {
                log.debug('AgencyController getAgenciesByAccountId Count: ' + JSON.stringify(records.oDataCount));
                //log.debug('AgencyController getAgenciesByAccountId Records: ' + JSON.stringify(records.value));
                records.value.forEach(agencies => {
                    res.push({'accountid': agencies._record1id_value});
                });
                log.debug('AgencyController getAgenciesByAccountId: ' + JSON.stringify(res));
                resolve(res);
            })
            .catch(error => {
                log.error('Erro Agency: ' + error.message);
                reject(error)
            })
    })
};

/**
 * get - Return an agency
 *
 * @param {array}   agencies
 *
 * @return {Promise<>} promise containing array of agency object
 */
let _getAgenciesInAccount = (agencies) => {
    log.debug('AgencyController -> getAgenciesInAccount');
    //log.debug('AgencyController -> getIdAgency -> req: ' + JSON.stringify(agencies));
    var res = [];
    if (agencies.length > 0) {
        let filtro = '';
        for(cont = 0; cont < agencies.length; cont++) {
            filtro = filtro.concat('accountid eq '+ agencies[cont].accountid);
            if (cont < (agencies.length - 1)) {
                filtro = filtro.concat(' or ');
            }
        }
        return new Promise((resolve, reject) => {
            var request = {
                collection: 'accounts',
                    select: ['name', 'accountid'],
                    filter: filtro,
                   orderBy: ['name asc'],
                     count: true
            };
            crmGo.dynamicsWebApi.retrieveRequest(request)
                .then(records => {
                    log.debug('AgencyController getAgenciesInAccount Count: ' + JSON.stringify(records.oDataCount));
                    //log.debug('Agency Request: ' + JSON.stringify(records.value));
                    records.value.forEach(account => {
                        res.push({
                            accountid: account.accountid.toUpperCase(),
                            name: account.name.toUpperCase()
                        })
                    });
                    //res = records.value;
                    resolve(res);
                })
                .catch(error => {
                    log.error('Erro getAgenciesInAccount: ' + error.message);
                    reject(error)
            });
        })
    } else {
        return new Promise(resolve => {
            res = {msg: 'Cliente não possui agência associada!'};
            resolve(res);
        });
    }
};

module.exports = {
    getAllAgencies: _getAllAgencies,
    getAgencyById: _getAgencyById,
    getAgencyByName: _getAgencyByName,
    getAgenciesInAccount: _getAgenciesInAccount,
    getAgenciesByAccountId: _getAgenciesByAccountId,
    get: _get
};

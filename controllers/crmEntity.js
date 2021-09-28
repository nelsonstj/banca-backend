const log = require('../helpers/log').logger;
const _ = require('lodash');
const crmGo = require('../helpers/crm');

/**
 * get - Return an entity
 *
 * @param {string} entity
 *
 * @return {Promise<>} promise containing entity object
 */
let _getAllEntity = (req) => {
    log.debug('AccountsController -> getAllEntity');
    let entity = req.params.entity;
    log.debug('AccountsController -> getAllEntity -> entity: ' + entity);
    let res = [];
    return new Promise((resolve, reject) => {
        var request = {
            collection: entity,
            top: 100
            //count: true
        };
        crmGo.dynamicsWebApi.retrieveRequest(request).then(record => {
            //log.debug('Entity Search: ' + JSON.stringify(record));
            log.debug('Entity Count: ' + JSON.stringify(record.oDataCount));
            res = record.value;
            resolve(res);
          }).catch(error => {
            log.error('Erro Entity: ' + error.message);
            reject(error)
        });
    })
};

module.exports = {
    getAllEntity: _getAllEntity
};

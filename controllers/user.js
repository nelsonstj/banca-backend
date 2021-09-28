const log = require('../helpers/log').logger;
const _ = require('lodash');
const inspect = require('eyes').inspector({maxLength: 200000});
const MAX_NUMBER_OF_USERS = 500; // used for listing users
const config = require('config');
const esConfig = config.get('elasticsearch.users');
const es = require('../helpers/esOperation');
const crmGo = require('../helpers/crm');

/**
 * get - Return an user data given an username
 *
 * @param {string}   username
 *
 * @return {Promise<>} promise containing user object
 */
let _get = ({ username }) => {
  log.debug('UserController -> get');
  inspect(username, 'username');
  return es.get(_.assign({ id: username }, esConfig))
    .then((result) => {
      let canUpload = _canUpload(result._source);
      return _.assign({ canUpload }, result._source)
    });
};

/**
 * update - Update user data
 *
 * @param {string}   username
 * @param {object}   data    object containing fields to update
 *
 * @return {Promise<>} promise containing update response
 * from elasticsearch
 */
let _update = ({username, data}) => {
  log.debug('UserController -> update');
  return es.update(_.assign({
      id: username,
      body: { doc: data },
    }, esConfig))
    .then((result) => { result._source; });
};

/**
 * getByGroup - Return all users data given an group id
 *
 * @param {string}   groupId
 *
 * @return {Promise<>} promise containing user object
 */
let _getByGroup = ({ groupId }) => {
  log.debug('UserController -> getByGroup');
  return es.search({
    index: esConfig.index,
    type: esConfig.type,
    body: {
      from: 0,
      size: MAX_NUMBER_OF_USERS,
      query: {
        bool: {
          must: [
            { match_phrase_prefix: { group: groupId } },
            { term: { active: true } }
          ]
        }
      }
    },
  })
  .then(results => results.hits.hits.map((hit) => {
    return _.assign(_.cloneDeep(hit._source), { id: hit._id });
  }));
};

let _canUpload = (user) => {
  log.debug('UserController -> canUpload');
  return user.group === 'AVynMWP90r3lkoFo1x7Z' || user.username === 'eduardo.giannotto';
};

/**
 * get - Return an user data given an username
 *
 * @param {string}   email
 * @return {Promise<>} promise containing user object
 */
let _getUserCrm = (email) => {
  log.debug('UserController -> getUserCrm');
  inspect(email, 'email');
  let res = [];
  return new Promise((resolve, reject) => {
    var request = {
      collection: 'systemusers',
          select:  ['fullname', 'internalemailaddress', 'systemuserid'],
          filter: "contains(internalemailaddress, '" + email + "')",
        //filter: "systemuserid eq 56B4131D-E08C-4BB4-BFB7-B3B80A6E379B",
           count: true
    };
    crmGo.dynamicsWebApi.retrieveRequest(request)
    .then((records) => {
      log.debug('UserController getUserCrm Count: ' + JSON.stringify(records.oDataCount));
      //log.debug('UserController getUserCrm records: ' + JSON.stringify(records));
      if (records.oDataCount > 0) {
        res = records.value;
        resolve(res);
      } else {
        reject({ type: 'getUserCrm' });
      }
    })
    .catch((error) => {
      log.error('Erro getUserCrm: ' + JSON.stringify(error));
      reject(error)
    });
  });
};

/**
 * get - Return an user data given an username
 *
 * @param {object}   usercrm
 * @return {Promise<>} promise containing user object
 */
let _getUserCrmRoles = ({ usercrm }) => {
  log.debug('UserController -> getUserCrmRoles');
  let res = [];
  return new Promise((resolve, reject) => {
    var roles = [];
    // roles.push('TVG - Acesso Básico');
    // roles.push('TVG - Diretor de Vendas');
    roles.push('TVG - Executivo de Vendas Internacional');
    roles.push('TVG - Executivo de Vendas Nacional');
    roles.push('TVG - Executivo de Vendas Nacional - Mídias Digitais');
    // roles.push('TVG - Gerente de Relacionamento - Mailing');
    // roles.push('TVG - Gerente do Portfólio de Produtos');
    // roles.push('TVG - Gestão de Vendas');
    // roles.push('TVG - Operador de Marketing');
    // roles.push('TVG - Secretariado');
    /*	{ "systemuserid": "CA49596A-FD2A-E711-8107-C4346BACC794" },
		{ "systemuserid": "DE49596A-FD2A-E711-8107-C4346BACC794" },
		{ "systemuserid": "9B23EA70-FD2A-E711-8107-C4346BACC794" },
		{ "systemuserid": "26F61CD8-F263-E711-810D-C4346BACC794" },
		{ "systemuserid": "3030C579-F263-E711-810A-C4346BB59890" },
		{ "systemuserid": "CD3F773E-F363-E711-810A-C4346BB59890" },
		{ "systemuserid": "F2E66DAA-A865-E711-810A-C4346BB59890" }
                                  "<condition attribute='systemuserid' operator='eq' value='CA49596A-FD2A-E711-8107-C4346BACC794' />" +
                                  "<condition attribute='systemuserid' operator='eq' value='" + usercrm[0].systemuserid.toUpperCase() + "' />" +
        */
    var request = 
      "<fetch mapping='logical' distinct='true'>" +
        "<entity name='systemuser'>" +
          "<attribute name='systemuserid' />" +
          "<link-entity name='systemuserroles' from='systemuserid' to='systemuserid'>" +
            "<filter type='and'>" +
              "<condition attribute='systemuserid' operator='eq' value='" + usercrm[0].systemuserid.toUpperCase() + "' />" +
            "</filter>" +
            "<link-entity name='role' from='roleid' to='roleid'>" +
              "<filter type='or'>";
                for (var i = 0; i < roles.length; i++) {
                  request += "<condition attribute='name' operator='eq' value='" + roles[i] + "' />";
                }
                request += "</filter>" +
              "<attribute name='name' />" +
              "<attribute name='roleid' />" + 
            "</link-entity>" +
          "</link-entity>" +
        "</entity>" +
      "</fetch>";
    crmGo.dynamicsWebApi.executeFetchXml('systemusers', request)
    .then((records) => {
      log.debug('UserController getUserCrmRoles records');
      // log.debug('UserController getUserCrmRoles records: ' + JSON.stringify(records));
      if (JSON.stringify(records.value) !== '[]') {
        records.value.forEach((record) => {
            res.push({ systemuserid: record.systemuserid.toUpperCase() });
        });
        res = _.uniqBy(res, 'systemuserid');
      }
      resolve(res);
    })
    .catch((error) => {
      log.error('Erro getUserCrmRoles: ' + JSON.stringify(error));
      reject(error)
    });
  });
};

module.exports = {
  get: _get,
  update: _update,
  getByGroup: _getByGroup,
  getUserCrm: _getUserCrm,
  getUserCrmRoles: _getUserCrmRoles
};

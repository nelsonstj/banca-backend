const log = require('../helpers/log').logger;
const _ = require('lodash');

const MAX_NUMBER_OF_GROUPS = 500; // used for listing groups
const config = require('config');
const esConfig = config.get('elasticsearch.groups');
const es = require('../helpers/esOperation');

/**
 * get - get a group given an id
 *
 * @param  {string} { id } group id to look for
 * @return {Promise<Group>}   promise containing the group
 */
let _get = ({id}) => {
    log.debug('groupController -> get');
    return es.get(_.assign({id}, esConfig))
        .then(result => result._source);
};

/**
 * getGroup - alias for `get`
 */
let _getGroup = ({id}) => {
    log.debug('groupController -> getGroup');
    return _get({id});
};

/**
 * create - create a group given a name and a category
 *
 * @param  {string} { group_name   }  group's name
 * @return {Promise<>}  promise containing object with group' id
 */
let _create = ({group_name, group_category}) => {

    log.debug('groupController -> create');

    return es.index({
        index: esConfig.index,
        type: esConfig.type,
        body: {
            name: group_name,
            category: group_category,
        },
    })
        .then(result => ({id: result._id}));
};

/**
 * getAll - get all groups
 *
 * @return {Promise<Array>}  promise containing an array of groups
 */
let _getAll = () => {
    log.debug('groupController -> getAll');
    let res = [];
    return new Promise((resolve, reject) => {
        es.search({
            index: esConfig.index,
            type: esConfig.type,
            body: {
                from: 0,
                size: MAX_NUMBER_OF_GROUPS,
                query: {
                    match_all: {},
                },
            },
        }).then((results) => {
                res = results.hits.hits.map((hit) => _.assign(_.cloneDeep(hit._source), {id: hit._id}));
        }).then(()=>{
            resolve(res);
        }).catch((err) => reject(err));
    })
};

module.exports = {
    get: _get,
    getGroup: _getGroup,
    create: _create,
    getAll: _getAll
};

const log = require('../helpers/log').logger;
const _ = require('lodash');
const bluebird = require('bluebird');
const config = require('config');
const esConfig = config.get('elasticsearch.activity');
const es = require('../helpers/esOperation');
const bodybuilder = require('bodybuilder');

/**
 * logActivity - log an activity at elasticsearch
 *
 * @param {string}   user    username
 * @param {object}   project project object
 * @param {string}   action  one of the actions listed at `ACTIONS` property
 *
 * @return {Promise<>} promise containing an elasticsearch response
 */
let _logActivity = ({user, project, action}) => {

    log.debug('activityController -> logActivity');

    const activityData = _.assign({
        at: new Date(),
        user: user.username,
        group: user.group,
        action,
    }, _.pick(project, ['id', 'name', 'main_type']));

    return es.index(_.assign({
        body: activityData,
    }, esConfig));
};



//TODO Remover controladores disso
/**
 *
 * @param userController
 * @param projectController
 * @param username
 * @param projectId
 * @param action
 * @private
 */ 
let _getAndLog = ({userController, projectController, username, projectId, action}) => {

    log.debug('activityController -> getAndLog');

    bluebird.props({
        user: userController.get({username}),
        project: projectController.get({id: projectId}),
    })
        .then(({user, project}) => _logActivity({user, action, project}));
};


let _getAndLog2 = ({user, action}, project) => {

    log.debug('activityController -> getAndLog2');

    return _logActivity({user, action, project})
};


let _getAndLogGeneric = ({userController, controller, username, id, action}) => {

    log.debug('activityController -> getAndLogGeneric');

    bluebird.props({
        user: userController.get({username}),
        project: controller.get({id: id, week_day_fmt: true}),
    })
        .then(({user, project}) => _logActivity({user, action, project}));
};

let _list = ({group_id, from, to}) => {

    log.debug('activityController -> list');

    const bob = bodybuilder()
        .query('match', 'group', group_id)
        .query('range', 'at', {gte: from, lte: to})
        .sort('at', 'desc');

    return es.search(_.assign({
        body: bob.build(),
        size: 100
    }, esConfig)).then(result => result.hits.hits.map(item => item._source));
};

module.exports = {
    ACTIONS: {
        CREATE: 'create',
        UPDATE: 'update',
        UPLOAD: 'upload',
        PDF: 'pdf'
    },
    getAndLog: _getAndLog,
    getAndLog2: _getAndLog2,
    getAndLogGeneric: _getAndLogGeneric,
    list: _list
};

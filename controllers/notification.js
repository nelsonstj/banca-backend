const log = require('../helpers/log').logger;
const _         = require('lodash');
const bluebird  = require('bluebird');
const aws = require('aws-sdk');
const config = require('config');

const sns =  new aws.SNS({ region: config.get('notifications.region') });
const snsConfig =  config.get('notifications');
const __subscribe = bluebird.promisify(sns.subscribe).bind(sns);
const __createPlatformEndpoint = bluebird.promisify(sns.createPlatformEndpoint).bind(sns);
const __publish = bluebird.promisify(sns.publish).bind(sns);


/**
 * ACTIONS - getter for constant actions property
 *
 * @return {object} object containing possible actions for the notifications
 */
// eslint-disable-next-line
let _ACTIONS = () => {

    log.debug('NotificationController -> ACTIONS');

    return {
        CREATE: 'create',
        UPDATE: 'update',
    };
};

/**
 * subscribe - Create a given device token's platform endpoint at
 * sns, then subscribe the endpoint to the broadcast topic
 *
 * @param {string}   token APNS device token
 *
 * @return {Promise<>} promise with SNS topic subscription
 * response
 */
let _subscribe = ({ token }) => {

    log.debug('NotificationController -> subscribe');

    return __createPlatformEndpoint({
        PlatformApplicationArn: snsConfig.application,
        Token: token,
    })
        .then(({ EndpointArn }) => __subscribe({
            Protocol: 'application',
            TopicArn: snsConfig.broadcast_topic,
            Endpoint: EndpointArn,
        }));
};

/**
 * _messageForAction - Return a message for a given action
 *  based on configured template
 *
 * @param {string}   action  one of the actions listed at
 * `ACTIONS` property
 * @param {string}   project project's name
 *
 * @param message
 * @return {string} the message
 */
let _messageForAction = ({ action, project }) => {

    log.debug('NotificationController -> messageForAction');
    return _.template(snsConfig.msg_templates[action])(project);
};


/**
 * _snsMessage - Return SNS/APNS formatted message
 *
 * @param {string}   action  one of the actions listed at
 * `ACTIONS` property
 * @param {string}   project project's name
 *
 * @param customMessage
 * @return {string} JSON encoded string in SNS format containing APNS
 * formatted message
 */
let _snsMessage = ({ project, action, customMessage = false }) => {

    log.debug('NotificationController -> snsMessage');

    const message = _messageForAction({ action, project });
    let _message = customMessage ? message + " " + customMessage : message;

    const apnsData = JSON.stringify({
        aps: {
            alert: _message,
            id: project.id,
        },
    });
    const data = {
        default: _message,
        APNS_SANDBOX: apnsData,
        APNS: apnsData,
    };
    return JSON.stringify(data);
};


/**
 * _publishEvent - Publishes an action for a project at broadcast
 * topic
 *
 * @param {string}   action  one of the actions listed at
 * `ACTIONS` property
 * @param {string}   project project's name
 *
 * @param customMessage
 * @return {Promise<>} promise with SNS topic publish
 * response
 */
let _publishEvent = ({ project, action, customMessage = false }) => {

    log.debug('NotificationController -> publishEvent');

    let message = _snsMessage({ project, action, customMessage });
    return __publish({
        TargetArn: snsConfig.broadcast_topic,
        MessageStructure: 'json',
        Message: message,
    });
};


/**
 *
 * @param projectController
 * @param project_id
 * @param action
 * @param customMessage
 * @private
 */
let _publish = ({ projectController, project_id, action, customMessage = false }) => {

    log.debug('NotificationController -> publish');

    projectController.get({ id: project_id })
        .then(project => _publishEvent({ project, action, customMessage }));
};


let _publish2 = (project, action, customMessage = false) => {

    log.debug('NotificationController -> publish2');

    return _publishEvent({ project, action, customMessage });
};

module.exports = {
    ACTIONS : _ACTIONS,
    subscribe : _subscribe,
    publish : _publish,
    publish2 : _publish2
};

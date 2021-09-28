const log = require('../helpers/log').logger;
const _ = require('lodash');
const aws = require('aws-sdk');
const config = require('config');
const MAX_NUMBER_OF_GROUPS = 500; // used for listing groups

const esConfig = config.get('elasticsearch.activity');
const es = require('../helpers/esOperation');

aws.config.update({
    secretAccessKey: config.get("aws").secretAccessKey,
    accessKeyId: config.get("aws").accessKeyId,
    region: config.get("aws").region
});

const ses = new aws.SES();


/**
 * get - get a group given an id
 *
 * @param  {string} { id } group id to look for
 * @return {Promise<Group>}   promise containing the group
 */
let _send = ({owner, projectName, users}) => {

    log.debug('NotificationEmailController -> send');

    return new Promise((resolve, reject ) => {
        let title = "Banca de Projetos – Notificação de alteração no Plano " + projectName;
        let body = "O Plano " + projectName + ", criado pelo grupo " + owner + " já está disponível para ser editado.";

        // Emails para mandar
        let emailList = [];
        users.forEach((user) => emailList.push(user.email));

        //Parâmetros
        let params = {
            Source: 'notification@apps.email.com.br',
            Destination: {
                ToAddresses: emailList
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: body
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: title
                }
            }
        };

        ses.sendEmail(params, function (err, data, res) {
            if(err) {
                log.error("Erro envio de email", err);
                reject(err);
            } else {
                log.debug(JSON.stringify(res));
                resolve();
            }
        });
    })

};


/**
 * getGroup - alias for `get`
 */
// TODO verificar esse GET
let _getGroup = ({id}) => {
    log.debug('NotificationEmailController -> getGroup');
    return _get({id});
};

/**
 *
 * @param group_name
 * @param group_category
 * @private
 */
let _create = ({group_name, group_category}) => {

    log.debug('NotificationEmailController -> create');

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

    log.debug('NotificationEmailController -> getAll');

    return es.search({
        index: esConfig.index,
        type: esConfig.type,
        body: {
            from: 0,
            size: MAX_NUMBER_OF_GROUPS,
            query: {
                match_all: {},
            },
        },
    })
        .then(results => results.hits.hits.map((hit) => {
            return _.assign(_.cloneDeep(hit._source), {id: hit._id});
        }));
};


module.exports = {
    send: _send,
    getGroup: _getGroup,
    create: _create,
    getAll: _getAll
};

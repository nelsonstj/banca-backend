const log = require('../helpers/log').logger;
const _ = require('lodash');
const config = require('config');
const moment = require('moment');
const DynamoClient = require('../helpers/dynamo');
const dynamoClient = new DynamoClient();
const aws = require('aws-sdk');
const s3 = new aws.S3({
  endpoint: 'http://' + config.get('attachments.bucket'),
  s3BucketEndpoint: true
});

/**
 * _createMerchandising - create a merchandising
 *
 * @param {object}   merchandising    merchandising data created
 * @param {object}   user             merchandising user
 *
 * @return {Promise} Promise
 */
let _createMerchandising = ({ merchandising, user }) => {
  log.info('MerchandisingController -> createMerchandising');
  let merchandisingData = {
    type: merchandising.type.toUpperCase(),
    title: merchandising.title,
    title_search: _.deburr(merchandising.title.toUpperCase()),
    description: merchandising.description,
    description_search: _.deburr(merchandising.description.toUpperCase()),
    initials: merchandising.initials.toUpperCase(),
    genre: _.deburr(merchandising.genre.toUpperCase()),
    rec_start_prediction: moment(merchandising.rec_start_prediction).format('YYYY-MM'),
    period_start_exhib: moment(merchandising.period_start_exhib).format('YYYY-MM'),
    period_end_exhib: moment(merchandising.period_end_exhib).format('YYYY-MM'),
    image: merchandising.image,
    attachments: merchandising.attachments,
    published_at: merchandising.publish ? moment().format('YYYY-MM-DD HH:mm') : null,
    published: merchandising.publish ? true : false,
    updated_at: moment().format('YYYY-MM-DD HH:mm'),
    created_by: user.username,
    created_at: moment().format('YYYY-MM-DD HH:mm')
  };
  //log.debug("CreateMerchandising merchandisingData: " + JSON.stringify(merchandisingData));
  return new Promise((resolve, reject) => {
    // Add the Merchandising to Dynamo
    dynamoClient
      .create('merchandisings', merchandisingData, true)
      .then(() => {
        log.info('CreateMerchandising inserida no Dynamo');
        resolve();
      })
      .catch(error => {
        log.error('CreateMerchandising - Merchandising não foi inserido no Dynamo - Erro: ' + error.message);
        reject(error);
      });
  });
};

/**
 * addAttachment - Add an attachment to a merchandising at elasticsearch
 *
 * @param {string}   id         Description
 * @param {object}   attachment Description
 *
 * @return {type} Description
 */
let _addAttachment = ({ id, attachment }) => {
  log.debug('MerchandisingController -> addAttachment');
  let dynamoData = {};
  dynamoData.id = id;
  return dynamoClient
    .read(esConfig.projeto.index, id)
    .then(data => {
      let parsedData = JSON.parse(data);
      if (!!parsedData.Item.attachments) {
        dynamoData.attachments = parsedData.Item.attachments;
        dynamoData.attachments.push(attachment);
      } else {
        dynamoData.attachments = [attachment];
      }
      return dynamoClient
        .update(esConfig.projeto.index, dynamoData)
        .then(() => { attachment; });
    })
    .catch(err => {
      log.error(err);
      throw err;
    });
};

/**
 * getAttachmentURL - Description
 *
 * @param {type}   bucket     Description
 * @param {type}   attachment Description
 *
 * @return {Promise} Description
 */
let _getAttachmentURL = ({ bucket, attachment }) => {
  log.debug('MerchandisingController -> getAttachmentURL');
  return new Promise((resolve, reject) => {
    s3.getSignedUrl(
      'getObject',
      {
        Bucket: bucket,
        Key: attachment
      },
      (err, url) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
  });
};

/**
 * _getAllMerchandisings - get all merchandisings
 *
 * @return {Promise<Array>}  promise containing an array of all merchandisings
 */
let _getAllMerchandisings = () => {
  log.debug('MerchandisingController -> getAllMerchandisings');
  let res = [];
  return new Promise((resolve, reject) => {
    var params = {};
    dynamoClient
      .scanner('merchandisings', params)
      .then(result => {
        // log.debug('getAllMerchandisings OK ' + result);
        let ret = JSON.parse(result);
        ret = _.orderBy(ret.Items, 'published_at', 'desc');
        ret.forEach(merchan => {
          res.push({
            id: merchan.id,
            type: merchan.type,
            genre: merchan.genre,
            initials: merchan.initials,
            title: merchan.title,
            description: merchan.description,
            rec_start_prediction: merchan.rec_start_prediction,
            period_start_exhib: merchan.period_start_exhib,
            period_end_exhib: merchan.period_end_exhib,
            image: merchan.image,
            attachments: merchan.attachments,
            published: merchan.published,
            published_at: merchan.published_at,
            updated_at: merchan.updated_at,
            created_by: merchan.created_by,
            created_at: merchan.created_at
          });
        });
        resolve(res);
      })
      .catch(error => {
        log.error('Erro getAllMerchandisings: ' + error);
        reject({ type: 'getAllMerchandisings' });
      });
  });
};

/**
 * _getMerchandisingById - get merchandisings by id
 *
 * @return {Promise<Array>}  promise containing an array of merchandisings
 */
let _getMerchandisingById = req => {
  log.debug('MerchandisingController -> getMerchandisingById');
  let res = [];
  return new Promise((resolve, reject) => {
    let params = {
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: { ':id': req.params.id }
    };
    dynamoClient
      .scanner('merchandisings', params)
      .then(result => {
        // log.debug('getMerchandisingById OK ' + result);
        let ret = [];
        ret = JSON.parse(result);
        ret = ret.Items;
        ret.forEach(merchan => {
          res.push({
            id: merchan.id,
            type: merchan.type,
            genre: merchan.genre,
            initials: merchan.initials,
            title: merchan.title,
            description: merchan.description,
            rec_start_prediction: merchan.rec_start_prediction,
            period_start_exhib: merchan.period_start_exhib,
            period_end_exhib: merchan.period_end_exhib,
            image: merchan.image,
            attachments: merchan.attachments,
            published: merchan.published,
            published_at: merchan.published_at,
            updated_at: merchan.updated_at,
            created_by: merchan.created_by,
            created_at: merchan.created_at
          });
        });
        resolve(res);
      })
      .catch(error => {
        log.error('Erro getMerchandisingById: ' + error);
        reject({ type: 'getMerchandisingById' });
      });
  });
};

/**
 * _getMerchandisingsByTitle - get merchandisings by title
 *
 * @return {Promise<Array>}  promise containing an array of merchandisings
 */
let _getMerchandisingsByTitle = req => {
  log.debug('MerchandisingController -> getMerchandisingsByTitle');
  let res = [];
  return new Promise((resolve, reject) => {
    let params = {
      FilterExpression: 'name = :title',
      ExpressionAttributeValues: { ':title': req.params.title }
    };
    dynamoClient
      .scanner('merchandisings', params)
      .then(result => {
        // log.debug('getMerchandisingsByTitle OK ' + result);
        // ret = JSON.parse(result);
        res = result;
        resolve(res);
      })
      .catch(error => {
        log.error('Erro getMerchandisingsByTitle: ' + error);
        reject({ type: 'getMerchandisingsByTitle' });
      });
  });
};

/**
 * _getMerchandisingsBySearch - get merchandisings by search
 *
 * @return {Promise<Array>}  promise containing an array of merchandisings
 */
let _getMerchandisingsBySearch = req => {
  log.info('MerchandisingController -> getMerchandisingsBySearch');
  let params = {};
  let res = [];
  return new Promise((resolve, reject) => {
    if (req.query.type || req.query.genre || req.query.period_start_exhib || req.query.period_end_exhib || 
        req.query.title_description || req.query.published) {
      let attributeNames = {};
      let attributeValues = {};
      let filter = '';
      let attrbs = [];
      let values = [];
      let rangeDate = false;
      if (req.query.period_start_exhib && req.query.period_end_exhib)
        rangeDate = true;
      Object.keys(req.query).forEach(k => {
        if (k === 'title_description') {
          attrbs.push('title_search');
          attrbs.push('description_search');
          values.push(_.deburr(req.query[k].toUpperCase()));
          values.push(_.deburr(req.query[k].toUpperCase()));
        } else if (k === 'order_by' || k === 'order_type') {
          return;
        } else {
          attrbs.push(k);
          k === 'published' 
            ? req.query.published === 'true' 
              ? values.push(true) 
              : values.push(false) 
            : values.push(_.deburr(req.query[k].replace('/', '-').toUpperCase()));
        }
      });
      for (let i = 0; i < values.length; i++) {
        attributeNames['#' + attrbs[i]] = attrbs[i];
        attributeValues[':' + attrbs[i]] = values[i];
      }
      let cont = 0;
      for (let i = 0; i < attrbs.length; i++) {
        if (attrbs[i] === 'title_search' || attrbs[i] === 'description_search') {
          filter +=
            attrbs.length - 1 === i
              ? 'contains (#' + attrbs[i] + ', :' + attrbs[i] + '))'
              : cont === 0
                ? '(contains (#' + attrbs[i] + ', :' + attrbs[i] + ') OR '
                : 'contains (#' + attrbs[i] + ', :' + attrbs[i] + ')) AND ';
          cont++;
        } else if (attrbs[i] === 'period_start_exhib') {
          filter += rangeDate
            ? '((#' + attrbs[i] + ' >= :' + attrbs[i] + ' AND #' + attrbs[i] + ' <= :period_end_exhib) OR '
            : attrbs.length - 1 === i
              ? '#' + attrbs[i] + ' >= :' + attrbs[i]
              : '#' + attrbs[i] + ' >= :' + attrbs[i] + ' AND ';
        } else if (attrbs[i] === 'period_end_exhib') {
          filter += rangeDate
            ? attrbs.length - 1 === i
              ? '(#' + attrbs[i] + ' >= :period_start_exhib AND #' + attrbs[i] + ' <= :' + attrbs[i] + '))'
              : '(#' + attrbs[i] + ' >= :period_start_exhib AND #' + attrbs[i] + ' <= :' + attrbs[i] + ')) AND '
            : attrbs.length - 1 === i
              ? '#' + attrbs[i] + ' <= :' + attrbs[i]
              : '#' + attrbs[i] + ' <= :' + attrbs[i] + ' AND ';
        } else {
          filter +=
            attrbs.length - 1 === i
              ? '#' + attrbs[i] + ' = :' + attrbs[i]
              : '#' + attrbs[i] + ' = :' + attrbs[i] + ' AND ';
        }
      }
      params = {
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
        FilterExpression: filter
      };
    }
    // log.debug('MerchandisingController -> getMerchandisingsBySearch -> params ' + JSON.stringify(params));
    dynamoClient
      .scanner('merchandisings', params)
      .then(result => {
        // log.debug('MerchandisingController -> getMerchandisingsBySearch OK ' + result);
        let ret = [];
        ret = JSON.parse(result);
        ret = req.query.order_by && req.query.order_type 
                ? _.orderBy(ret.Items, req.query.order_by, req.query.order_type) 
                : _.orderBy(ret.Items, 'published_at', 'desc');
        ret.forEach(merchan => {
          res.push({
            id: merchan.id,
            type: merchan.type,
            genre: merchan.genre,
            initials: merchan.initials,
            title: merchan.title,
            description: merchan.description,
            rec_start_prediction: merchan.rec_start_prediction,
            period_start_exhib: merchan.period_start_exhib,
            period_end_exhib: merchan.period_end_exhib,
            image: merchan.image,
            attachments: merchan.attachments,
            published: merchan.published,
            published_at: merchan.published_at,
            updated_at: merchan.updated_at,
            created_by: merchan.created_by,
            created_at: merchan.created_at
          });
        });
        resolve(res);
      })
      .catch(error => {
        log.error('MerchandisingController -> Erro getMerchandisingsBySearch: ' + error);
        let err = JSON.parse(error);
        reject({ type: 'getMerchandisingsBySearch', msg: err.message });
      });
  });
};

/**
 * getMaxMinDate - get maximum and minimum date of specific merchandising field
 *
 * @return {Promise<Array>}  promise containing an array of maximum and minimum date
 */
let getMaxMinDate = field => {
  log.debug('MerchandisingController -> getMaxMinDate');
  let res = [];
  return new Promise((resolve, reject) => {
    let paramDate = { KeyConditionExpression: { field: ': ' + field } };
    dynamoClient
      .scanner('merchandisings', paramDate)
      .then(result => {
        //log.debug('MerchandisingController -> getMerchandisingsBySearch MAX ' + result);
        let ret = JSON.parse(result);
        let resp = [];
        if (field === 'period_start_exhib') {
          ret.Items.forEach(merchan => {
            resp.push({ date: merchan.period_start_exhib });
          });
        } else if (field === 'period_end_exhib') {
          ret.Items.forEach(merchan => {
            resp.push({ date: merchan.period_end_exhib });
          });
        }
        resp = _.orderBy(resp, 'date', 'desc');
        res = {
          maxDate: resp[0].date,
          minDate: resp[resp.length - 1].date
        };
        log.debug('MerchandisingController -> getMaxMinDate -> res: ' + JSON.stringify(res));
        resolve(res);
      })
      .catch(error => {
        log.error('MerchandisingController -> Erro getMaxMinDate: ' + error);
        reject({ type: 'getMaxMinDate' });
      });
  });
};

module.exports = {
  createMerchandising: _createMerchandising,
  addAttachment: _addAttachment,
  getAttachmentURL: _getAttachmentURL,
  getAllMerchandisings: _getAllMerchandisings,
  getMerchandisingById: _getMerchandisingById,
  getMerchandisingsByTitle: _getMerchandisingsByTitle,
  getMerchandisingsBySearch: _getMerchandisingsBySearch
};

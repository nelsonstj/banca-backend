const aws = require('aws-sdk');
const config = require('config');
const log = require('../helpers/log').logger;

const esConfig = config.get('elasticsearch');
const s3 = new aws.S3({
  endpoint: `http://${config.get('attachments.bucket')}`,
  s3BucketEndpoint: true
});
const s3Delete = new aws.S3();
const es = require('../helpers/esOperation');
// const log = require('../helpers/log').logger;

/**
 * getAttachmentURL - Description
 *
 * @param {type}   bucket     Description
 * @param {type}   attachment Description
 *
 * @return {Promise} Description
 */
const _getAttachmentURL = ({ bucket, attachment }) => new Promise((resolve, reject) => {
  log.debug('AttachmentController -> getAttachmentURL -> bucket:', bucket);
  log.debug('AttachmentController -> getAttachmentURL -> attachment:', attachment);
  s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: attachment
    },
      (err, url) => {
        if (err) reject(err);
        else resolve(url);
      }
    );
});

const _getAttachmentURLWithCheck = ({ bucket, attachment }) => new Promise((resolve, reject) => {
  s3.headObject({ Bucket: bucket, Key: attachment }, (err) => {
    if (err && err.code === 'NotFound') {
      reject(err);
    } else {
      s3.getSignedUrl(
          'getObject',
        {
          Bucket: bucket,
          Key: attachment
        },
          (error, url) => {
            if (error) reject(error);
            else resolve(url);
          }
        );
    }
  });
});

/**
 *
 * @param id
 * @param attachment
 * @param type
 * @private
 */
const _addAttachment = ({ id, attachment, type }) => {
  const attachScript =
    'ctx._source.attachments.add(params.attachment);\
                           ctx._source.updated_at = params.updated_at';

  // TODO MIGRAR PRO DYNAMO
  return es
    .update({
      index: esConfig.index,
      type,
      id,
      body: {
        script: {
          inline: attachScript,
          lang: 'painless',
          params: { attachment, updated_at: new Date() }
        }
      }
    })
    .then(() => attachment);
};

/**
 *
 * @param project_id
 * @param bucket
 * @param attachment
 * @returns {Promise}
 * @private
 */
const _deleteAttachment = ({ bucket, attachment }) => new Promise((resolve, reject) => {
  s3Delete.deleteObject(
    {
      Bucket: bucket,
      Key: attachment
    },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
});

const _getAllAttachments = ({ id, type }) => es
    .get({
      index: esConfig.index,
      type,
      id
    })
    .then(result => result._source.attachments);

module.exports = {
  getAttachmentURL: _getAttachmentURL,
  addAttachment: _addAttachment,
  deleteAttachment: _deleteAttachment,
  getAllAttachments: _getAllAttachments,
  getAttachmentURLWithCheck: _getAttachmentURLWithCheck
};

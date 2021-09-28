const router = require('express').Router();
const config = require('config');
// const request = require('request');
// const inspect = require('eyes').inspector({ maxLength: 200000 });
const uploadMiddleware = require('../middlewares/upload');
const aws = require('aws-sdk');

const s3 = new aws.S3();

// Business
const IndiceBusiness = require('../business/indices');

router.post(
  '/upload',
  uploadMiddleware
    .standard({
      bucket: config.get('attachments.bucket'),
      fileTable: 'indice-de-conversao'
    })
    .single('attachment'),
  (req, res) => {
    const attachment = req.s3_path;
    const indiceBusiness = new IndiceBusiness({});

    indiceBusiness
      .getAttachmentURL({ bucket: config.get('attachments.bucket'), attachment })
      .then(scope => indiceBusiness.conversion())
      .then(scope => indiceBusiness.enviarResposta(res, 200, scope.attachmentURL))
      .catch(err => indiceBusiness.errorHandler(err, res));
  }
);

router.get('/download', (req, res) => {
  const indiceBusiness = new IndiceBusiness({});
  indiceBusiness
    .getIndexConversao({ bucket: config.get('attachments.bucket') })
    .then(scope => indiceBusiness.enviarResposta(res, 200, scope.attachmentURL))
    .catch(err => indiceBusiness.errorHandler(err, res));
});

module.exports = router;

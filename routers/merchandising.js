// External references
//const _ = require('lodash');
const aws = require('aws-sdk');
const config = require('config');
const router = require('express').Router();

// Internal references
const log = require("../helpers/log").logger;
const schemas = require('../schemas/merchandising');
const validate = require('../middlewares/validate');
const requireUser = require('../middlewares/requireUser');
const uploadMiddleware = require('../middlewares/upload').standard;

const s3 = new aws.S3({
  endpoint: `http://${config.get('attachments.bucket')}`,
  s3BucketEndpoint: true
});

const MerchandisingBusiness = require('../business/merchandising');

router.use(requireUser);

router.post('/upload', uploadMiddleware({ s3, bucket: config.get('attachments.bucket'), fileTable: 'merchandising' }).single('attachment'),
  (req, res) => {
    log.info('MerchandisingRouter -> post Upload Attachment');
    const merchandisingBusiness = new MerchandisingBusiness({});
    merchandisingBusiness.addAttachment(req, 'merchandising')
      .then((scope) => merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 201, scope.resultAddAttachment))
      .catch(err => merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res));
  }
);

router.post('', validate({ body: schemas.merchandisingPostSchema }), (req, res) => {
  log.info('MerchandisingRouter -> post Create Merchandising');
  if (res.statusCode !== 400) {
    const merchandisingBusiness = new MerchandisingBusiness({});
    merchandisingBusiness.getUser(req)
      .then(() => { merchandisingBusiness.createMerchandising(req); })
      .then(() => { merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 201, { msg: "Merchandising criado com sucesso!" }); })
      .catch((err) => { merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res); });
  }
});

router.get('/all', (req, res) => {
  log.info('MerchandisingRouter -> all');
  const merchandisingBusiness = new MerchandisingBusiness({});
  merchandisingBusiness.getAllMerchandisings()
    .then((scope) => { merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 200, scope.merchandisings); })
    .catch((err) => { merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res); });
});

router.get('/search', validate({ query: schemas.merchandisingSearchSchema }), (req, res) => {
  log.info('MerchandisingRouter -> search');
  const merchandisingBusiness = new MerchandisingBusiness({});
  merchandisingBusiness.getMerchandisingsBySearch(req)
    .then((scope) => { merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 200, scope.merchandisings); })
    .catch((err) => { merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res); });
});

router.get('/title', (req, res) => {
  log.info('MerchandisingRouter -> title');
  const merchandisingBusiness = new MerchandisingBusiness({});
  merchandisingBusiness.getMerchandisingsByTitle(req)
      .then((scope) => { merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 200, scope.merchandisings); })
      .catch((err) => { merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res); });
});

router.get('/download/:attachment', (req, res) => {
  log.info("MerchandisingRouter -> get Attachment");
  const merchandisingBusiness = new MerchandisingBusiness({});
  merchandisingBusiness.getAttachmentURL({
      bucket: config.get('attachments.bucket'),
      attachment: 'merchandising/' + req.params.attachment
    })
    .then((scope) => { merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 200, { url: scope.attachmentURL }); })
    .catch((err) => { merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res); });
});

router.get('/:id', (req, res) => {
  log.info('MerchandisingRouter -> get merchandising id');
  const merchandisingBusiness = new MerchandisingBusiness({});
  merchandisingBusiness.getMerchandisingById(req)
    .then((scope) => { merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 200, scope.merchandising); })
    .catch((err) => { merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res); });
});

router.get('', (req, res) => {
  log.info('MerchandisingRouter -> all');
  const merchandisingBusiness = new MerchandisingBusiness({});
  merchandisingBusiness.getAllMerchandisings()
      .then((scope) => { merchandisingBusiness.enviarRespostaMerchandisingBusiness(res, 200, scope.merchandisings); })
      .catch((err)  => { merchandisingBusiness.errorHandlerMerchandisingBusiness(err, res); });
});

module.exports = router;

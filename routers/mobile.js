const router = require('express').Router();
const log = require('winston');
const httpHelper = require('../helpers/http');
const MobileController = require('../controllers/mobile');
const aws = require('aws-sdk');
const config = require('config');

router.get('/version', (req, res) => {
  let controller = new MobileController(new aws.S3(), config.get('mobile.bucket'));

  controller.getVersion()
    .then(result => res.json(result))
    .catch((err) => {
      log.error(err);
      httpHelper.errorResponse(res);
    });
});

module.exports = router;
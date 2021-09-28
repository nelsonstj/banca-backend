const requireUser = require('../middlewares/requireUser');
const uploadMiddleware = require('../middlewares/upload').standard;
const router = require('express').Router();
const config = require('config');
const aws = require('aws-sdk');

// Business
const NetSponsorshipBusiness = require('../business/net_sponsorships');

const s3 = new aws.S3({
  endpoint: `http://${config.get('attachments.bucket')}`,
  s3BucketEndpoint: true
});

router.use(requireUser);

router.get('', (req, res) => {
  const netSponsorshipBusiness = new NetSponsorshipBusiness({});
  netSponsorshipBusiness
    .checkGetReq(req)
    .then(scope => netSponsorshipBusiness.checkExhibitors(req))
    .then(scope => netSponsorshipBusiness.calibrateStartDate(req))
    .then(scope => netSponsorshipBusiness.queryPriceTable(req))
    .then(scope => netSponsorshipBusiness.groupPricesByCompetence(req))
    .then(scope => netSponsorshipBusiness.queryProgramData(req))
    .then(scope =>
      netSponsorshipBusiness.getAllAttachments(
        scope.resultQueryProgramData[0].Id,
        'net_sponsorships'
      )
    )
    .then(scope => netSponsorshipBusiness.getProgramIndex(req))
    .then(scope => netSponsorshipBusiness.getSiscomPlans(req))
    .then(scope => netSponsorshipBusiness.enviarResposta(res, 200, scope.parsedResponse))
    .catch(err => netSponsorshipBusiness.errorHandler(err, res));
});

router.post(
  '/:id/upload',
  uploadMiddleware({ s3, bucket: config.get('attachments.bucket') }).single('attachment'),
  (req, res) => {
    const netSponsorshipBusiness = new NetSponsorshipBusiness({});
    netSponsorshipBusiness
      .addAttachment(req, 'net_sponsorships')
      .then(scope => netSponsorshipBusiness.enviarResposta(res, 201, scope.resultAddAttachment))
      .then(scope => netSponsorshipBusiness.getAndLog(req, 'upload'))
      .catch(err => netSponsorshipBusiness.errorHandler(err, res));
  }
);

router.delete('/:id/attachments/:attachment', (req, res) => {
  const netSponsorshipBusiness = new NetSponsorshipBusiness({});
  netSponsorshipBusiness
    .deleteAttachment(req)
    .then(scope => netSponsorshipBusiness.updateAttachentHandler(req))
    .then(scope => netSponsorshipBusiness.enviarResposta(res, 204, null))
    .catch(err => netSponsorshipBusiness.errorHandler(err, res));
});

router.get('/:id/attachments', (req, res) => {
  const netSponsorshipBusiness = new NetSponsorshipBusiness({});
  netSponsorshipBusiness
    .getAllAttachments()
    .then(scope => netSponsorshipBusiness.enviarResposta(res, 200, scope.parsedResponse))
    .catch(err => netSponsorshipBusiness.errorHandler(err, res));
});

module.exports = router;

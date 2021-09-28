const router = require("express").Router();
const config = require("config");
const _ = require("lodash");
const aws = require("aws-sdk");
const log = require("../helpers/log").logger;
const requireUser = require("../middlewares/requireUser");
const schemas = require("../schemas/sponsorship");
const validate = require("../middlewares/validate");
const uploadMiddleware = require("../middlewares/upload").standard;

//Business
const SponsorshipBusiness = require("../business/sponsorships");

const s3 = new aws.S3({
  endpoint: `http://${config.get('attachments.bucket')}`,
  s3BucketEndpoint: true
});

router.use(requireUser);

router.post("/:id/upload", uploadMiddleware({ s3, bucket: config.get("attachments.bucket") }).single("attachment"), (req, res) => {
  log.info("Sponsorships Router -> Upload attachment");
  let sponsorshipBusiness = new SponsorshipBusiness({});
  sponsorshipBusiness.getUser(req)
    .then(scope => sponsorshipBusiness.get(req))
    .then(scope => sponsorshipBusiness.addAttachment(req, "sponsorships"))
    .then(scope => sponsorshipBusiness.enviarResposta(res, 201, scope.resultAddAttachment))
    .then(scope => sponsorshipBusiness.getAndLog(req, "upload"))
    .catch(err  => sponsorshipBusiness.errorHandler(err, res));
});

router.post("", validate({
    query: schemas.sponsorshipPostQuerySchema,
    body: req => schemas.makeSponsorshipSchema( _.flatten([req.query.main_type].concat(req.query.extra_type || [])) )
  }),
  (req, res) => {
    log.info("Sponsorships Router -> Creating sponsorship");
    let sponsorshipBusiness = new SponsorshipBusiness({ holder_changed: req._body.holder_changed === true });
    sponsorshipBusiness.getUser(req)
      .then(scope => sponsorshipBusiness.checkUser())
      .then(scope => sponsorshipBusiness.create(req))
      .then(scope => sponsorshipBusiness.integracaoEnviar()) // Integração com CRM Dynamics
      .then(scope => sponsorshipBusiness.getAllGroupWithHolderChanged())
      .then(scope => sponsorshipBusiness.resolveGroup(req))
      .then(scope => sponsorshipBusiness.userGetByGroup(req))
      .then(scope => sponsorshipBusiness.notificationEmailHandler())
      .then(scope => sponsorshipBusiness.enviarResposta(res, 201, scope.project))
      .then(scope => sponsorshipBusiness.getAndLog(req, "create"))
      .then(scope => sponsorshipBusiness.publish(req, scope.project, "create"))
      .catch(err  => sponsorshipBusiness.errorHandler(err, res));
  }
);

router.put("/:id", (req, res) => { 
  log.info("Sponsorships Router -> Updating sponsorship");
  req._body = req.body;
  let sponsorshipBusiness = new SponsorshipBusiness({ holder_changed: req._body.holder_changed === true });
  sponsorshipBusiness.getUser(req)
    .then(scope => sponsorshipBusiness.get(req))
    .then(scope => sponsorshipBusiness.getGroup())
    .then(scope => sponsorshipBusiness.validaHolder())
    .then(scope => sponsorshipBusiness.tratamentoUpdateProject(req))
    .then(scope => sponsorshipBusiness.updateSponsorship(req))
    .then(scope => sponsorshipBusiness.integracaoEnviar()) // Integração com CRM Dynamics
    .then(scope => sponsorshipBusiness.userGetByGroup(req))
    .then(scope => sponsorshipBusiness.notificationEmailHandler())
    .then(scope => sponsorshipBusiness.enviarResposta(res, 204))
    .then(scope => sponsorshipBusiness.getAndLog(req, "update"))
    .then(scope => sponsorshipBusiness.publish(req, scope.project, "update"))
    .catch(err  => sponsorshipBusiness.errorHandler(err, res));
});

router.delete("/:id/attachments/:attachment", (req, res) => {
  log.info("Sponsorships Router -> Delete attachment");
  let sponsorshipBusiness = new SponsorshipBusiness({});
  sponsorshipBusiness.deleteAttachment(req)
    .then(scope => sponsorshipBusiness.updateAttachentHandler(req))
    .then(scope => sponsorshipBusiness.enviarResposta(res, 204, null))
    .catch(err  => sponsorshipBusiness.errorHandler(err, res));
});

router.get("/recents", (req, res) => {
  log.info("Sponsorships Router -> Get recents sponsorships");
  let sponsorshipBusiness = new SponsorshipBusiness({});
  sponsorshipBusiness.validateSponsorshipType(req)
    .then(scope => sponsorshipBusiness.queryRecentSponsorships(req))
    .then(scope => sponsorshipBusiness.enviarResposta(res, 200, { response: scope.resultQueryRecentSponsorships }))
    .catch(err  => sponsorshipBusiness.errorHandler(err, res));
});

router.get("/:id/download/:attachment", (req, res) => {
  log.info("Sponsorships Router -> Download attachment");
  let sponsorshipBusiness = new SponsorshipBusiness({});
  sponsorshipBusiness.getAttachmentURL({
      bucket: config.get("attachments.bucket"),
      attachment: req.params.attachment
    })
    .then(scope => sponsorshipBusiness.enviarResposta(res, 200, { url: scope.attachmentURL }))
    .catch(err  => sponsorshipBusiness.errorHandler(err, res));
});

router.get("/:id",validate({ query: schemas.sponsorship_id_query_schema }), (req, res) => {
  log.info("Sponsorships Router -> Get specific sponsorship");
  let sponsorshipBusiness = new SponsorshipBusiness({});
  sponsorshipBusiness.getUser(req)
    .then(scope => sponsorshipBusiness.getGroup())
    .then(scope => sponsorshipBusiness.get(req))
    .then(scope => sponsorshipBusiness.verificaPermissaoLeitura())
    .then(scope => sponsorshipBusiness.enviarResposta(res, 200, scope.sponsorship))
    .catch(err  => sponsorshipBusiness.errorHandler(err, res));
});

module.exports = router;

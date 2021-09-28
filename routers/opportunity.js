const router = require("express").Router();
const log = require("../helpers/log").logger;
const schemas = require("../schemas/opportunity");
const validate = require("../middlewares/validate");
const requireUser = require("../middlewares/requireUser");
const OpportunityBusiness = require("../business/opportunity");

router.use(requireUser);

router.post("", validate({ body: schemas.opportunityPostSchema }), (req, res) => {
  log.info("OpportunityRouter -> post ");
  if (res.statusCode !== 400) {
    const opportunityBusiness = new OpportunityBusiness({});
    opportunityBusiness.getUser(req)
      .then((scope) => opportunityBusiness.getUserCrmRoles(req.user.email))
      .then((scope) => opportunityBusiness.getProductToOpportunity(req.body.produtoId))
      .then((scope) => opportunityBusiness.createOpportunity(req))
      .then((scope) => opportunityBusiness.createOpportunityProduct(req))
      .then((scope) => opportunityBusiness.enviarResposta(res, 201, { msg: scope.opportunity.msg }))
      .catch((err) => opportunityBusiness.errorHandler(err, res));
  }
});

router.get('/count', validate({ query: schemas.opportunityProductSchema }), (req, res) => {
  log.info('OpportunityRouter -> count');
  const opportunityBusiness = new OpportunityBusiness({});
  // opportunityBusiness.getProductToOpportunity(req.query.produtoId).then((scope) => 
  opportunityBusiness.getOpportunitiesCountByProduct(req.query)
    .then((scope) => opportunityBusiness.enviarResposta(res, 200, scope.counts))
    .catch((err) => opportunityBusiness.errorHandler(err, res));
});

router.get('/count/all', (req, res) => {
  log.info('OpportunityRouter -> count/all');
  let opportunityBusiness = new OpportunityBusiness({});
  opportunityBusiness.getAllOpportunitiesCount()
    .then((scope) => opportunityBusiness.enviarResposta(res, 200, scope.counts))
    .catch((err) => opportunityBusiness.errorHandler(err, res));
});

router.get('/count/all/:origem', (req, res) => {
  log.info('OpportunityRouter -> count/all/:origem');
  let opportunityBusiness = new OpportunityBusiness({});
  if (allOrigins.indexOf(req.params.origem) === -1) {
    return opportunityBusiness.enviarResposta(res, 400, 'A origem da oferta: ' + req.params.origem + ' não existe!');
  }
  opportunityBusiness.getAllOpportunitiesCount(req.params.origem)
    .then((scope) => opportunityBusiness.enviarResposta(res, 200, scope.counts))
    .catch((err) => opportunityBusiness.errorHandler(err, res));
});

router.get('/count/:main_type', (req, res) => {
  log.info('OpportunityRouter -> count/:main_type');
  let opportunityBusiness = new OpportunityBusiness({});
  if (allTypes.indexOf(req.params.main_type) === -1) {
    return opportunityBusiness.enviarResposta(res, 400, 'O tipo de oferta: ' + req.params.main_type + ' não existe!');
  }
  opportunityBusiness.getOpportunitiesCount(req.params.main_type)
    .then((scope) => opportunityBusiness.enviarResposta(res, 200, scope.counts))
    .catch((err) => opportunityBusiness.errorHandler(err, res));
});

const allTypes = [
  'local',
  'national',
  'digital_media',
  'local_sponsorship',
  'national_sponsorship',
  'net_sponsorship'
];

const allOrigins = [
  'app', 'web', 'teste'
];
module.exports = router;

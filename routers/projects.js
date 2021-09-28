// External references
const _ = require('lodash');
const log = require('winston');
const aws = require('aws-sdk');
const config = require('config');
const router = require('express').Router();

// Internal references
const schemas = require('../schemas/project');
const validate = require('../middlewares/validate');
const requireUser = require('../middlewares/requireUser');
const uploadMiddleware = require('../middlewares/upload').standard;

const s3 = new aws.S3({
  endpoint: `http://${config.get('attachments.bucket')}`,
  s3BucketEndpoint: true
});

const ProjectBusiness = require('../business/projects');

router.use(requireUser);

router.post(
  '/:id/upload',
  uploadMiddleware({ s3, bucket: config.get('attachments.bucket') }).single('attachment'),
  (req, res) => {
    const projectBusiness = new ProjectBusiness({});

    projectBusiness
      .getUser(req)
      .then(scope => projectBusiness.getProject(req))
      .then(scope => projectBusiness.addAttachment(req, 'projects'))
      .then(scope => projectBusiness.enviarResposta(res, 201, scope.resultAddAttachment))
      .then(scope => projectBusiness.getAndLog(req, 'upload'))
      .catch(err => projectBusiness.errorHandler(err, res));
  }
);

function buildValidateProject() {
  return {
    query: schemas.projectPostQuerySchema,
    body: req =>
      schemas.makeProjectSchema(_.flatten([req.query.main_type].concat(req.query.extra_type || [])))
  };
}

function buildPutValidateProject() {
  return {
    query: schemas.projectPutQuerySchema,
    body: req => schemas.makeProjectSchema('*')
  };
}

router.post('', validate(buildValidateProject()), (req, res) => {
  log.info('Creating project');

  const projectBusiness = new ProjectBusiness({ holder_changed: req._body.holder_changed === true });

  projectBusiness
    .getUser(req)
    .then(scope => projectBusiness.checkUser())
    .then(scope => projectBusiness.createProject(req))
    .then(scope => projectBusiness.integracaoEnviar())
    .then(scope => projectBusiness.checkProject())
    .then(scope => projectBusiness.getAllGroupWithHolderChanged())
    .then(scope => projectBusiness.resolveGroup(req))
    .then(scope => projectBusiness.userGetByGroup(req))
    .then(scope => projectBusiness.notificationEmailHandler())
    .then(scope => projectBusiness.enviarResposta(res, 201, { id: scope.project.id }))
    .then(scope => projectBusiness.getAndLog(req, 'create'))
    .then(scope => projectBusiness.publish(req, scope.project, 'create'))
    .catch(err => projectBusiness.errorHandler(err, res));
});

router.get('/recents', (req, res) => {
  const projectBusiness = new ProjectBusiness({});
  projectBusiness
    .validateProjectType(req, res)
    .then(scope => projectBusiness.queryRecentProjects(req))
    .then(scope =>
      projectBusiness.enviarResposta(res, 200, { response: scope.resultQueryRecentProjects })
    )
    .catch(err => projectBusiness.errorHandler(err, res));
});

router.get('/:id/download/:attachment', (req, res) => {
  const projectBusiness = new ProjectBusiness({});
  projectBusiness
    .getAttachmentURL({
      bucket: config.get('attachments.bucket'),
      attachment: req.params.attachment
    })
    .then(scope => projectBusiness.enviarResposta(res, 200, { url: scope.attachmentURL }))
    .catch(err => projectBusiness.errorHandler(err, res));
});

router.delete('/:id/attachments/:attachment', (req, res) => {
  const projectBusiness = new ProjectBusiness({});
  projectBusiness
    .deleteAttachment(req)
    .then(scope => projectBusiness.updateAttachentHandler(req))
    .then(scope => projectBusiness.enviarResposta(res, 204, null))
    .catch(err => projectBusiness.errorHandler(err, res));
});

router.get('/:id', validate({ query: schemas.project_id_query_schema }), (req, res) => {
  log.debug(`Looking for id ${req.params.id}`);
  const projectBusiness = new ProjectBusiness({});
  projectBusiness
    .getUser(req)
    .then(scope => projectBusiness.getGroup())
    .then(scope => projectBusiness.getProject(req))
    .then(scope => projectBusiness.verificaPermissaoLeitura())
    .then(scope => projectBusiness.enviarResposta(res, 200, scope.project))
    .catch(err => projectBusiness.errorHandler(err, res));
});

router.put('/:id', validate(buildPutValidateProject()), (req, res) => {
  const projectBusiness = new ProjectBusiness({ holder_changed: req._body.holder_changed === true });
  projectBusiness
    .getUser(req)
    .then(scope => projectBusiness.getProject(req))
    .then(scope => projectBusiness.getGroup())
    .then(scope => projectBusiness.validaHolder())
    .then(scope => projectBusiness.tratamentoUpdateProject(req))
    .then(scope => projectBusiness.updateProject(req))
    .then(scope => projectBusiness.integracaoEnviar())
    .then(scope => projectBusiness.userGetByGroup(req))
    .then(scope => projectBusiness.notificationEmailHandler())
    .then(scope => projectBusiness.enviarResposta(res, 204))
    .then(scope => projectBusiness.getAndLog(req, 'update'))
    .then(scope => projectBusiness.publish(req, scope.project, 'update'))
    .catch(err => projectBusiness.errorHandler(err, res));
});

module.exports = router;

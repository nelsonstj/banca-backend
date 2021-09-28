const log = require('../helpers/log').logger;
const _ = require('lodash');
const httpHelper = require('../helpers/http');
const config = require('config');

const projectController = require('../controllers/project');

const UserBusiness = require('./user');
const GroupBusiness = require('./group');
const ActivityBusiness = require('./activity');
const NotificationBusiness = require('./notification');
const AttachmentBusiness = require('./attachments');

function ProjectBusiness(scope) {
    this.scope = scope;
    Object.assign(ProjectBusiness.prototype, UserBusiness.prototype);
    Object.assign(ProjectBusiness.prototype, GroupBusiness.prototype);
    Object.assign(ProjectBusiness.prototype, ActivityBusiness.prototype);
    Object.assign(ProjectBusiness.prototype, NotificationBusiness.prototype);
    Object.assign(ProjectBusiness.prototype, AttachmentBusiness.prototype);
}


ProjectBusiness.prototype.checkProject = function () {

    log.info('ProjectBusiness -> checkProject');

    return new Promise((resolve) => {
        log.info(`holder_changed: ${this.scope.holder_changed}`);
        resolve(this.scope);
    })
};

ProjectBusiness.prototype.validaHolder = function () {

    log.info('ProjectBusiness -> validaHolder');

    return new Promise((resolve, reject) => {
        if (this.scope.project.holder === undefined) {
            this.scope.project['holder'] = this.scope.project.owner;
        }
        if (_isValidHolder(this.scope.project.holder, this.scope.user.group)) {
            resolve(this.scope)
        } else {
            reject({type: "validaHolder"})
        }

    })
};

ProjectBusiness.prototype.tratamentoUpdateProject = function (req) {

    log.info('ProjectBusiness -> tratamentoUpdateProject');

    return new Promise((resolve) => {
        this.scope.payload = req._body;

        if (this.scope.group.category === 'tv') {
            this.scope.payload = _.omit(this.scope.payload, 'digital_media');
        } else {
            this.scope.payload = _.omit(this.scope.payload, 'local');
            this.scope.payload = _.omit(this.scope.payload, 'national');
        }
        this.scope.payload = _.omit(this.scope.payload, 'holder_changed');

        this.scope.holder = this.scope.payload.holder;
        this.scope.projectName = this.scope.payload.name;

        resolve(this.scope);
    })
};

ProjectBusiness.prototype.createProject = function (req) {

    log.info('ProjectBusiness -> createProject');

    return new Promise((resolve, reject) => {
        projectController.create({
            data: req._body,
            user: this.scope.user,
            main_type: req.query.main_type,
        }).then((project) => {
            this.scope.project = project;
            resolve(this.scope)
        }).catch((err) => reject({type: "createProject", err: err}))
    });
};

ProjectBusiness.prototype.integracaoEnviar = function () {
  log.info('ProjectBusiness -> integracaoEnviar');
  return new Promise((resolve, reject) => {
    projectController.enviarBarramento(this.scope.project).then(()=>{
      resolve(this.scope)
    }).catch((err) => reject({type: "integracaoEnviar", err: err}));
  });
};

ProjectBusiness.prototype.updateProject = function (req) {

    log.info('ProjectBusiness -> updateProject');

    return new Promise((resolve, reject) => {
        projectController.update({
            id: req.params.id,
            data: this.scope.payload,
        }).then((project) => {
            this.scope.project = project;
            resolve(this.scope)
        }).catch((err) => reject({type: "updateProject", err: err}))
    });
};

ProjectBusiness.prototype.getProject = function (req) {

    log.info('ProjectBusiness -> getProject');

    return new Promise((resolve, reject) => {
        projectController.get({
            id: req.params.id,
            week_day_fmt: req.query.week_day_fmt === 'string',
        }).then((project) => {
            this.scope.project = project;
            resolve(this.scope);
        }).catch((err) => {
            if (err !== undefined && err.status === 404) {
                reject({type: "getProjectNotFound"});
            } else {
                reject({type: "getProject", err: err})
            }
        })
    });
};


ProjectBusiness.prototype.verificaPermissaoLeitura = function () {

    log.info('ProjectBusiness -> verificaPermissaoLeitura');

    return new Promise((resolve, reject) => {
        if (_isValidOwner(this.scope.project.main_type, this.scope.project.owner, this.scope.group.category, this.scope.user.group) ||
            this.scope.project.published || _isValidHolder(this.scope.project.holder, this.scope.user.group)) {
            resolve(this.scope);
        }
        else {
            reject({type: "verificaPermissaoLeitura"})
        }
    });
};

ProjectBusiness.prototype.resolveGroup = function (req) {

    log.info('ProjectBusiness -> resolveGroup');

    return new Promise((resolve) => {
        if (this.scope.holder_changed === true) {
            this.scope.owner = _getGroupNameById(req._body.owner, this.scope.group);
            this.scope.projectName = req._body.name;
            resolve(this.scope);
        } else {
            resolve(this.scope);
        }
    });
};

ProjectBusiness.prototype.enviarResposta = function (res, status, msg) {

    log.info('ProjectBusiness -> enviarResposta');

    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

ProjectBusiness.prototype.search = function (req) {

    log.info('ProjectBusiness -> search');

    return new Promise((resolve, reject) => {
        const formatWeekDay = !!req._query.week_day_fmt && (req._query.week_day_fmt === 'string');
        const opts = {q: req._query.q, week_day_fmt: formatWeekDay};
        opts.filters = _.pickBy(req._query, (v, k) => _.startsWith(k, 'ft_'));
        opts.search_method = req._query.search_method || 'match';
        opts.offset = req.query.offset;

        projectController.search(opts)
            .then(result => {
                this.props.searchResult = result;
                resolve(this.scope);
            }).catch((err) => reject({type: "search", err: err}))
    })
};

ProjectBusiness.prototype.filterAvailableQuotas = function () {

    log.info('ProjectBusiness -> filterAvailableQuotas');

    return new Promise((resolve, reject) => {
        projectController.filterAvailableQuotas(this.scope.searchResult).then((result) => {
            this.scope.resultFilterAvailableQuotas = result;
            resolve(this.scope);
        }).catch((err) => reject({type: "filterAvailableQuotas", err: err}))
    })
};


ProjectBusiness.prototype.queryRecentProjects = function (req) {

    log.info('ProjectBusiness -> queryRecentProjects');

    return new Promise((resolve, reject) => {
        projectController.queryRecentProjects(req)
            .then((data) => {
                this.scope.resultQueryRecentProjects = data;
                resolve(this.scope);
            }).catch((err) => reject({type: "queryRecentProjects", err: err}))
    })
};


ProjectBusiness.prototype.validateProjectType = function (req, res) {

    log.info('ProjectBusiness -> validateProjectType');

    return new Promise((resolve, reject) => {
        if (!projectController.validateProjectType(req.query.type)) {
            res.status(400).json({
                message: 'Tipo de projeto válido deve ser informado.',
                fields: 'type',
            });
            reject({type: "validateProjectType"})
        } else {
            resolve(this.scope);
        }

    })
};


ProjectBusiness.prototype.updateAttachentHandler = function (req) {

    log.info('ProjectBusiness -> updateAttachentHandler');

    return new Promise((resolve, reject) => {
        projectController.updateAttachentHandler({
            project_id: req.params.id,
            attachment: req.params.attachment,
        })
            .then(() => resolve(this.scope))
            .catch((err) => reject({type: "updateAttachentHandler", err: err}));

    })
};

ProjectBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        case 'addAttachmentNotFound':
            httpHelper.notFoundResponse(res);
            break;
        case 'getGroupNotFound':
            httpHelper.notFoundResponse(res);
            break;
        case 'getProjectNotFound':
            httpHelper.notFoundResponse(res);
            break;
        case 'verificaPermissaoLeitura':
            httpHelper.forbiddenResponse(res);
            break;
        case 'checkUser':
            httpHelper.forbiddenResponse(res);
            break;
        case 'validaHolder':
            httpHelper.forbiddenResponse(res);
            break;
        default:
            httpHelper.errorResponse(res);
    }
};


function _getGroupNameById(id, res) {
    return res.filter(function (grupo) {
        if (grupo.id === id) return grupo
    })[0].name;
}

function _getGroupById(id, res) {
  return res.filter(function (grupo) {
    if (grupo.id === id) return grupo
  })
}

function _isValidOwner(projectMainType, projectOwnerId, userGroupCategory, userGroupId) {
    // Projetos de mídias digitais só podem ser alteradas por pessoas de mídias digitais
    if (projectMainType === 'digital_media' &&
        userGroupCategory !== config.get('permission.digital_media_group')) {
        return false;
    }

    // Projetos só podem ser alterados por membros do mesmo grupo ou por grupos de MD
    return (userGroupId === projectOwnerId);
}

function _isValidHolder(projectHolderId, userGroupId) {
    return userGroupId === projectHolderId;
}


module.exports = ProjectBusiness;
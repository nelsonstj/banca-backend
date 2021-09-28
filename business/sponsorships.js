const log = require('../helpers/log').logger;
const _ = require('lodash');
const httpHelper = require('../helpers/http');
const config = require('config');

// Controllers
const sponsorshipController = require('../controllers/sponsorship');

const UserBusiness = require('./user');
const GroupBusiness = require('./group');
const ActivityBusiness = require('./activity');
const NotificationBusiness = require('./notification');
const AttachmentBusiness = require('./attachments');

function SponsorshipBusiness(scope) {
    this.scope = scope;
    Object.assign(SponsorshipBusiness.prototype, UserBusiness.prototype);
    Object.assign(SponsorshipBusiness.prototype, GroupBusiness.prototype);
    Object.assign(SponsorshipBusiness.prototype, ActivityBusiness.prototype);
    Object.assign(SponsorshipBusiness.prototype, NotificationBusiness.prototype);
    Object.assign(SponsorshipBusiness.prototype, AttachmentBusiness.prototype);
}


SponsorshipBusiness.prototype.checkProject = function () {
    log.info('SponsorshipBusiness -> checkProject');
    return new Promise((resolve) => {
        log.info(`holder_changed: ${this.scope.holder_changed}`);
        resolve(this.scope);
    })
};

SponsorshipBusiness.prototype.validaHolder = function () {
    log.info('SponsorshipBusiness -> validaHolder');
    return new Promise((resolve, reject) => {
        if (this.scope.sponsorship.holder === undefined) {
            this.scope.sponsorship['holder'] = this.scope.sponsorship.owner;
        }
        if (_isValidHolder(this.scope.sponsorship.holder, this.scope.user.group)) {
            resolve(this.scope)
        } else {
            reject({type: "validaHolder"})
        }
    })
};

SponsorshipBusiness.prototype.tratamentoUpdateProject = function (req) {
    log.info('SponsorshipBusiness -> tratamentoUpdateProject');
    return new Promise((resolve) => {
        this.scope.payload = req.body;
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

SponsorshipBusiness.prototype.create = function (req) {
    log.info('SponsorshipBusiness -> create');
    return new Promise((resolve, reject) => {
        sponsorshipController.create({
            data: req._body,
            user: this.scope.user,
            main_type: req.query.main_type,
        }).then((project) => {
            this.scope.project = project;
            resolve(this.scope)
        }).catch((err) => reject({type: "createProject", err: err}))
    });
};

SponsorshipBusiness.prototype.integracaoEnviar = function () {
    log.info('SponsorshipBusiness -> integracaoEnviar');
    return new Promise((resolve, reject) => {
        sponsorshipController.enviarBarramento(this.scope.project)
        .then(() => resolve(this.scope))
        .catch((err) => reject({type: "integracaoEnviar", err: err}));
    });
};

SponsorshipBusiness.prototype.updateSponsorship = function (req) {
    log.info('SponsorshipBusiness -> updateSponsorship');
    return new Promise((resolve, reject) => {
        sponsorshipController.update({
            id: req.params.id,
            data: this.scope.payload,
        }).then(() => {
            this.scope.project = this.scope.sponsorship;
            resolve(this.scope)
        }).catch((err) => reject({type: "updateSponsorship", err: err}))
    });
};

SponsorshipBusiness.prototype.get = function (req) {
    log.info('SponsorshipBusiness -> get');
    return new Promise((resolve, reject) => {
        sponsorshipController.get({
            id: req.params.id,
            week_day_fmt: req.query.week_day_fmt === 'string',
        }).then((sponsorship) => {
            this.scope.sponsorship = sponsorship;
            resolve(this.scope);
        }).catch((err) => {
                if (err !== undefined && err.status === 404) {
                    reject({type: "getNotFound"});
                } else {
                    reject({type: "get", err: err})
                }
            });
    });
};

SponsorshipBusiness.prototype.verificaPermissaoLeitura = function () {
    log.info('SponsorshipBusiness -> verificaPermissaoLeitura');
    return new Promise((resolve, reject) => {
        if (_isValidOwner(this.scope.sponsorship.main_type, this.scope.sponsorship.owner, this.scope.group.category, this.scope.user.group) ||
            this.scope.sponsorship.published || _isValidHolder(this.scope.sponsorship.holder, this.scope.user.group)) {
            resolve(this.scope);
        } else {
            reject({type: "verificaPermissaoLeitura"})
        }
    });
};

SponsorshipBusiness.prototype.resolveGroup = function (req) {
    log.info('SponsorshipBusiness -> resolveGroup');
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

SponsorshipBusiness.prototype.validateSponsorshipType = function (req) {
    log.info('SponsorshipBusiness -> validateSponsorshipType');
    return new Promise((resolve, reject) => {
        let data = req.query.type;
        if (typeof data === 'undefined') resolve(this.scope);
        data = data === 'national' ? 'national_sponsorship' : data;
        switch (data) {
            case 'national_sponsorship':
            case 'local':
            case 'digital_media':
                resolve(this.scope);
                break;
            default:
                reject({type: "validateSponsorshipType"})
        }
    });
};

SponsorshipBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info('SponsorshipBusiness -> enviarResposta');
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

SponsorshipBusiness.prototype.search = function (req) {
    log.info('SponsorshipBusiness -> search');
    return new Promise((resolve, reject) => {
        const formatWeekDay = !!req._query.week_day_fmt && (req._query.week_day_fmt === 'string');
        const opts = {q: req._query.q, week_day_fmt: formatWeekDay};
        opts.filters = _.pickBy(req._query, (v, k) => _.startsWith(k, 'ft_'));
        opts.search_method = req._query.search_method || 'match';
        opts.offset = req.query.offset;
        sponsorshipController.search(opts)
            .then(result => {
                this.props.searchResult = result;
                resolve(this.scope);
            }).catch((err) => reject({type: "search", err: err}))
    })
};

SponsorshipBusiness.prototype.filterAvailableQuotas = function () {
    log.info('SponsorshipBusiness -> filterAvailableQuotas');
    return new Promise((resolve, reject) => {
        sponsorshipController.filterAvailableQuotas(this.scope.searchResult).then((result) => {
            this.scope.resultFilterAvailableQuotas = result;
            resolve(this.scope);
        }).catch((err) => reject({type: "filterAvailableQuotas", err: err}))
    })
};

SponsorshipBusiness.prototype.queryRecentSponsorships = function (req) {
    log.info('SponsorshipBusiness -> queryRecentSponsorships');
    return new Promise((resolve, reject) => {
        sponsorshipController.queryRecentSponsorships(req)
            .then((data) => {
                this.scope.resultQueryRecentSponsorships = data;
                resolve(this.scope)
            }).catch((err) => reject({type: "queryRecentSponsorships", err: err}));
    })
};

SponsorshipBusiness.prototype.validateProjectType = function (req, res) {
    log.info('SponsorshipBusiness -> validateProjectType');
    return new Promise((resolve, reject) => {
        if (!sponsorshipController.validateProjectType(req.query.type)) {
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

SponsorshipBusiness.prototype.updateAttachentHandler = function (req) {
    log.info('SponsorshipBusiness -> updateAttachentHandler');
    return new Promise((resolve, reject) => {
        sponsorshipController.updateAttachentHandler({
            project_id: req.params.id,
            attachment: req.params.attachment,
        })
            .then(() => resolve(this.scope))
            .catch((err) => reject({type: "updateAttachentHandler", err: err}));
    })
};

SponsorshipBusiness.prototype.errorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        case 'validateSponsorshipType':
            httpHelper.responseBadRequest(res, {
                message: 'Tipo de patrocínio válido deve ser informado.',
                fields: 'type',
            });
            break;
        case 'addAttachmentNotFound':
            httpHelper.notFoundResponse(res);
            break;
        case 'getGroupNotFound':
            httpHelper.notFoundResponse(res);
            break;
        case 'getProjectNotFound':
            httpHelper.notFoundResponse(res);
            break;
        case 'getNotFound':
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

function _isValidOwner(projectMainType, projectOwnerId, userGroupCategory, userGroupId) {
    // Projetos de mídias digitais só podem ser alteradas por pessoas de mídias digitais
    if (projectMainType === 'digital_media' && userGroupCategory !== config.get('permission.digital_media_group')) {
        return false;
    }
    // Projetos só podem ser alterados por membros do mesmo grupo ou por grupos de MD
    return (userGroupId === projectOwnerId);
}

function _isValidHolder(projectHolderId, userGroupId) {
    return userGroupId === projectHolderId;
}

module.exports = SponsorshipBusiness;

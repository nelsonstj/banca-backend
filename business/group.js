const elasticsearch = require('elasticsearch');
const httpHelper = require('../helpers/http');
const groupController = require('../controllers/group');
const log = require('../helpers/log').logger;
const _ = require('lodash');


function GroupBusiness(scope) {
    this.scope = scope;
}

GroupBusiness.prototype.getAllGroupWithHolderChanged = function () {
    log.info('GroupBusiness -> getAllGroupWithHolderChanged');
    return new Promise((resolve, reject) => {
        if (this.scope.holder_changed === true) {
            groupController.getAll().then((group) => {
                this.scope.group = group;
                resolve(this.scope);
            }).catch((err) => reject({type: "getAllGroupWithHolderChanged", err: err}))
        } else {
            resolve(this.scope);
        }
    });
};

GroupBusiness.prototype.getAllGroup = function () {
    log.info('GroupBusiness -> getAllGroup');
    return new Promise((resolve, reject) => {
        groupController.getAll().then((group) => {
            this.scope.group = group;
            resolve(this.scope);
        }).catch((err) => reject({type: "getAllGroup", err: err}))
    });
};

GroupBusiness.prototype.getGroup = function () {
    log.info('GroupBusiness -> getGroup');
    return new Promise((resolve, reject) => {
        groupController.getGroup({id: this.scope.user.group}).then((group) => {
            this.scope.group = group;
            resolve(this.scope);
        }).catch((err) => {
                if (err !== undefined && err.status === 404) {
                    reject({type: "getGroupNotFound"});
                } else {
                    reject({type: "getGroup", err: err})
                }
            })

    });
};

GroupBusiness.prototype.getSearchGroup = function () {
  log.info('GroupBusiness -> getSearchGroup');
  return new Promise((resolve, reject) => {

    if (_.isUndefined(this.scope.user.group)) {
      log.info('usuário não possui grupo vinculado');
      resolve(this.scope)
    } else {
      groupController.getGroup({id: this.scope.user.group}).then((group) => {
        this.scope.group = group;
        resolve(this.scope);
      }).catch((err) => {
        if (err !== undefined && err.status === 404) {
          reject({type: "getGroupNotFound"});
        } else {
          reject({type: "getGroup", err: err})
        }
      })
    }
  });
};

GroupBusiness.prototype.groupErrorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        default:
            httpHelper.errorResponse(res);
    }
};

GroupBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info('GroupBusiness -> enviarResposta');
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

GroupBusiness.prototype.createGroup = function (req) {
    log.info('GroupBusiness -> createGroup');
    return new Promise((resolve, reject) => {
        groupController.create({group_name: req.body.name, group_category: req.body.category}).then((result) => {
            this.scope.resultCreatedGroup = result;
            resolve(this.scope);
        }).catch((err) => reject({type: "createGroup", err: err}))
    });
};


module.exports = GroupBusiness;
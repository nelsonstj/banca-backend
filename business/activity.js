const log = require('../helpers/log').logger;

const httpHelper = require('../helpers/http');

const activityController = require('../controllers/activity');

function ActivityBusiness(scope) {
    this.scope = scope;
}

ActivityBusiness.prototype.getAndLog = function (req, action) {
    log.info("ActivityBusiness -> getAndLog");

    return new Promise((resolve, reject) => {
        activityController.getAndLog2({
            user: req.user,
            action: action,
        }, this.scope.project).then((log) => {
            this.scope.log = log;
            resolve(this.scope);
        }).catch((err) => {
            reject({type: "getAndLog", err: err});
        })
    })
};

ActivityBusiness.prototype.activityList = function (req) {
    log.info("ActivityBusiness -> activityList");
    return new Promise((resolve, reject) => {
        activityController.list({
            group_id: req.params.id,
            from: req.query.from,
            to: req.query.to,
        }).then((result) => {
            this.scope.resultActivityList = result;
            resolve(this.scope);
        }).catch((err) => {
            reject({type: "activityList", err: err});
        })
    })
};

ActivityBusiness.prototype.activityErrorHandler = function (err, res) {
    log.error(err);
    switch (err.type) {
        default:
            httpHelper.errorResponse(res);
    }
};

ActivityBusiness.prototype.enviarResposta = function (res, status, msg) {
    log.info("ActivityBusiness -> enviarResposta");
    return new Promise((resolve) => {
        res.status(status).json(msg);
        resolve(this.scope);
    })
};

module.exports = ActivityBusiness;
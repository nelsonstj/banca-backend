const log = require('../helpers/log').logger;

//Contollers
const notificationController = require('../controllers/notification');
const notificationEmailController = require('../controllers/notificationEmail');
const activityController = require('../controllers/activity');


function NotificationBusiness(scope) {
    this.scope = scope;
}

NotificationBusiness.prototype.publish = function (req, envio, action) {
    log.info('NotificationBusiness -> publish');
    return new Promise((resolve) => {
        let message = req._body.push_message ? req._body.push_message : false;
        if (req._body.published && req._body.send_push_notification) {
            notificationController.publish2(envio, action, message);
        }
        resolve(this.scope);
    })
};

NotificationBusiness.prototype.notificationEmailHandler = function () {
    log.info('NotificationBusiness -> notificationEmailHandler');
    return new Promise((resolve, reject) => {
        if (this.scope.holder_changed === true) {
            notificationEmailController.send({
                owner: this.scope.owner,
                projectName: this.scope.projectName,
                users: this.scope.userGroup
            }).then(() => resolve(this.scope)).catch((err) => reject({type: "notificationEmailHandler", err: err}));
        } else {
            resolve(this.scope);
        }
    })
};

module.exports = NotificationBusiness;
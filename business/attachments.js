const _ = require('lodash');
const uuid = require('uuid');
const config = require('config');
const log = require('../helpers/log').logger;
const attachmentController = require('../controllers/attachment');

function AttachmentBusiness(scope) {
    this.scope = scope;
}

AttachmentBusiness.prototype.getAttachmentURL = function ({ bucket, attachment }) {
    log.info('AttachmentBusiness -> getAttachmentURL');
    log.debug('AttachmentBusiness -> getAttachmentURL -> bucket:', bucket);
    log.debug('AttachmentBusiness -> getAttachmentURL -> attachment:', attachment);
    return new Promise((resolve, reject) => {
        attachmentController.getAttachmentURL({
            bucket,
            attachment,
        }).then((url) => {
            this.scope.attachmentURL = url;
            resolve(this.scope);
        }).catch((err) => reject({ type: 'getAttachmentURL', err: err }));
    })
};

AttachmentBusiness.prototype.getAttachmentURLWithCheck = function ({ bucket, attachment }) {
    log.info('AttachmentBusiness -> getAttachmentURLWithCheck');
    return new Promise((resolve, reject) => {
        attachmentController.getAttachmentURLWithCheck({
            bucket,
            attachment,
        }).then((url) => {
            this.scope.attachmentURL = url;
            resolve(this.scope);
        }).catch((err) => reject({ type: 'getAttachmentURLWithCheck', err: err }));
    })
};

AttachmentBusiness.prototype.deleteAttachment = function (req) {
    log.info('AttachmentBusiness -> deleteAttachment');
    return new Promise((resolve, reject) => {
        attachmentController.deleteAttachment({
            bucket: config.get('attachments.bucket'),
            attachment: req.params.attachment,
        })
            .then(() => resolve(this.scope))
            .catch((err) => reject({ type: 'deleteAttachment', err: err }));
    })
};

AttachmentBusiness.prototype.addAttachment = function (req, type) {
    log.info('AttachmentBusiness -> addAttachment');
    return new Promise((resolve, reject) => {
        if (type === 'merchandising') {
            attachment = { path: req.s3_path };
            this.scope.resultAddAttachment = attachment;
            resolve(this.scope);
        };
        attachmentController.addAttachment({
            id: req.params.id ? req.params.id : uuid(),
            attachment: {
                path: req.s3_path,
                label: req.body.label
            },
            type: type
        }).then((resultAddAttachment) => {
            this.scope.resultAddAttachment = resultAddAttachment;
            resolve(this.scope);
        }).catch((err) => {
            if (err !== undefined && err.status === 404) {
                reject({ type: 'addAttachmentNotFound' });
            } else {
                reject({ type: 'addAttachment', err: err });
            }
        })

    })
};

AttachmentBusiness.prototype.getAllAttachments = function (id, type) {
    log.info('AttachmentBusiness -> getAllAttachments');
    return new Promise((resolve, reject) => {
        attachmentController.getAllAttachments({
            id: id,
            type: type
        }).then((result) => {
            _.assign(this.scope.parsedResponse, { 'attachments': result || [] });
            resolve(this.scope);
        }).catch((err) => reject({ type: 'getAllAttachments', err: err }));
    })
};

module.exports = AttachmentBusiness;
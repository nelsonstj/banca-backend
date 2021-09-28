const bluebird = require('bluebird');

/**
 * MobileController - Controller for mobile application auto update information
 *
 * @param {aws.S3}   s3     s3 sdk instance
 * @param {string}   bucket bucket name
 *
 */
function MobileController(s3, bucket) {
    this.s3 = s3;
    this.bucket = bucket;
    this._getObject = bluebird.promisify(s3.getObject).bind(s3);
}

/**
 * getVersion - Get the current version of the iOS app
 *
 * @return {Promise<object>} returns a promise containing app's current version and download url
 */
MobileController.prototype.getVersion = function getVersion() {
    return this._getObject({
        Bucket: this.bucket,
        Key: 'version.json',
    }).then(data => JSON.parse(data.Body.toString('utf-8')))
        .then(data => ({url: data.updateUrl, version: data.latestVersion}));
};

module.exports = MobileController;
const _ = require('lodash');
const moment = require('moment');

function queryAvailableQuota(bob) {
  return function query(ft_available_quota, ft_exhibitor) {
    let innerBob = bob;

    if (_.isNil(ft_available_quota) || ft_exhibitor) {
      return innerBob;
    }

    let today = moment().utc().format("YYYY-MM-DD");

    if (JSON.parse(ft_available_quota)) {
      innerBob.query('bool', "must", [{
        "bool": {
          "should": [{
            "match": {
              "siscom_data.isAvailable": ft_available_quota
            }
          }, {
            "match": {
              "digital_media.isAvailable": true
            }
          }]
        }
      }]);
    } else {
      innerBob.query('bool', "must", [{
        "bool": {
          "should": [{
            "match": {
              "siscom_data.isAvailable": ft_available_quota
            }
          }, {
            "match": {
              "digital_media.isAvailable": false
            }
          }]
        }
      }]);
    }

    return innerBob;
  }
}

exports.queryAvailableQuota = queryAvailableQuota;
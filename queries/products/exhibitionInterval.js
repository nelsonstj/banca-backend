const moment = require('moment');

function exhibitionInterval(bob) {
  return function query(startDate, endDate) {
    let innerBob = bob;
    let dateFilter = {};

    if (!!startDate) {
      dateFilter.gte = moment.utc(startDate, moment.ISO_8601).format("YYYY-MM-DD");
    } else {
      startDate = moment(new Date).utc().format("YYYY-MM-DD");
      dateFilter.gte = moment(new Date).utc().format("YYYY-MM-DD");
    }

    if (!!endDate) {
      dateFilter.lte = moment.utc(endDate, moment.ISO_8601).format("YYYY-MM-DD");
    } else {
      dateFilter.lte = null;
    }

    if (startDate || endDate) {
      dateFilter.format = "yyyy-MM-dd";
      innerBob.query('bool', "should", [{
        "range": {
          "priorityDate": {
            "gte": dateFilter.gte,
            "lte": dateFilter.lte,
            "format": "yyyy-MM-dd"
          }
        }
      },
      {
        "bool": {
          "must_not": {
            "exists": {
              "field": "priorityDate"
            }
          }
        }
      }
      ]);
    }

    return innerBob;
  }
}

exports.exhibitionInterval = exhibitionInterval;
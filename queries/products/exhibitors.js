// const inspect = require('eyes').inspector({ maxLength: 200000 });
const util = require('../../helpers/util');

function queryExhibitors(bob) {
  return function query(exhibitors, availableQuota) {
    const innerBob = bob;

    if (exhibitors && availableQuota) {
      if (exhibitors.length > 0) {
        if (exhibitors.length === 1) {
          if (JSON.parse(availableQuota)) {
            innerBob.query('match', 'siscom_data.availableExhibitors', exhibitors[0]);
          } else {
            innerBob.query('bool', 'should', [
              {
                match: {
                  'siscom_data.unavailableExhibitors': exhibitors[0]
                }
              },
              {
                match: {
                  'siscom_data.queueExhibitors': exhibitors[0]
                }
              }
            ]);
          }
        } else {
          const components = [];
          exhibitors.forEach((value) => {
            if (JSON.parse(availableQuota)) {
              components.push({ match: { 'siscom_data.availableExhibitors': value } });
            } else {
              components.push({
                bool: {
                  should: [
                    {
                      match: {
                        'siscom_data.unavailableExhibitors': value
                      }
                    },
                    {
                      match: {
                        'siscom_data.queueExhibitors': value
                      }
                    }
                  ]
                }
              });
            }
          });

          innerBob.query('bool', 'should', components);
        }
      }
    } else if (exhibitors.length > 0) {
      if (exhibitors.length === 1) {
        innerBob.query('match', 'siscom_data.quotas.location', exhibitors[0]);
      } else {
        const components = [];
        exhibitors.forEach((value) => {
          components.push({ match: { 'siscom_data.quotas.location': value } });
        });

        innerBob.query('bool', 'should', components);
      }
    }

    return innerBob;
  };
}

exports.queryExhibitors = queryExhibitors;

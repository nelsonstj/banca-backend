const _ = require('lodash');

function queryProjectType(bob) {
  return function query(projectType) {
    const innerBob = bob;
    if (projectType && projectType.length > 0) {
      innerBob.query('bool', 'should', [
        {
          match: { 'local.type': projectType }
        }
      ]);
    }
    return innerBob;
  };
}

exports.queryProjectType = queryProjectType;

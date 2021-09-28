const joi = require('joi');
const _ = require('lodash');
const log = require('winston');


function _getSchema(req, schemas, location) {
  if (_.isFunction(schemas[location])) {
    return schemas[location](req);
  }
  return schemas[location];
}


module.exports = schemas => (req, res, next) => {
  try {
    _.each(schemas, (_schema, location) => {
      const schema = _getSchema(req, schemas, location);

      const result = joi.validate(req[location], schema);
      if (result.error) {
        log.debug('User error ', result.error);
        res.status(400).json(result.error.details);
      } else {
        req[`_${location}`] = result.value;
        log.debug(`Validated ${location}`);
      }
    });
    next();
  } catch (e) {
    log.error(e);
  }
};

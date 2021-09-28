const joi = require('joi');


const schemas = {
  content_genders: {
    label: joi.string(),
    associatedTo: joi.array().items(joi.string()),
  },
};

const bulk_schema = constant_type => joi.array().items(schemas[constant_type]);


exports.validate = function (data, constant_type) {
  return joi.validate(data, bulk_schema(constant_type));
};

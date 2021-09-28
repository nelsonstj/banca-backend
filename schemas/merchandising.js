const Joi = require('joi');
const Extension = require('joi-date-extensions');
const joi = Joi.extend(Extension);

exports.merchandisingPostSchema = {
  type: joi.string().required(),
  title: joi.string().required(),
  description: joi.string().max(350).required(),
  initials: joi.string().allow(null),
  genre: joi.string().required(),
  rec_start_prediction: joi.date().format('YYYY/MM').required(),
  period_start_exhib: joi.date().format('YYYY/MM').required(),
  period_end_exhib: joi.date().format('YYYY/MM').required(),
  publish: joi.bool().required(),
  image: joi.string().required(),
  attachments: joi.array().items({
    type: joi.string(),
    url: joi.string(),
  })
};

exports.merchandisingSearchSchema = {
  title_description: joi.string().max(350).allow(null),
  type: joi.string().allow(null),
  genre: joi.string().allow(null),
  period_start_exhib: joi.date().format('YYYY/MM').allow(null),
  period_end_exhib: joi.date().format('YYYY/MM').allow(null),
  published: joi.bool().allow(null),
  order_by: joi.string().allow(null),
  order_type: joi.string().allow(null)
};

let anexosSchema = joi.object().keys({
  type: joi.string(),
  url: joi.string(),
}).empty({});

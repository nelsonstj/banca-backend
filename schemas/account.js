const joi = require('joi');
const _ = require('lodash');

exports.accountSearchQuerySchema = {
    q: joi.string()
  };
  
  
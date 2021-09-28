const express = require('express');
const requireUser = require('../middlewares/requireUser');
const httpHelper = require('./http');
const schemas = require('../schemas/constants');
const log = require('winston');
const util = require('./util');
const _ = require('lodash');

exports.make_router = function makeRouter(constantType, esConfig, userRequired = true) {
  const router = express.Router();

  if (userRequired) {
    router.use(requireUser);
  }

  router.get('', (req, res) => {
    util
      .constantListing(constantType)
      .then((result) => {
        let objResult = result;
        if (constantType === 'commercial_scheme') {
          objResult = result.map((item) => {
            item.id = parseInt(item.id);
            return item;
          });
        }
        if (constantType === 'states') {
          objResult = _.orderBy(objResult, 'name', 'asc');
        }
        return res.json(objResult);
      })
      .catch((err) => {
        log.error(err);
        httpHelper.errorResponse(res);
      });
  });

  router.post('', (req, res) => {
    const _body = schemas.validate(req.body, constantType);
    if (_body.error) {
      log.error(_body.error.details);
      return res.status(400).json(_body.error.details);
    }
    return util.createConstants(constantType, _body.value).then(() => res.status(201).end());
  });

  return router;
};

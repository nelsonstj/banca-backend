const express = require('express');
const httpHelper = require('../helpers/http');
const log = require('winston');
const _ = require('lodash');
const util = require('../helpers/util');
const router = express.Router();

router.get('', (req, res) => {
        util.constantListing('quota_types')
            .then(result => res.json(_.orderBy(result, 'priority')))
            .catch((err) => {
                log.error(err);
                httpHelper.errorResponse(res);
            })
    }
);

module.exports = router;

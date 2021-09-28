const router = require('express').Router();
const passport = require('passport');
const log = require('../helpers/log').logger;

router.post('',
            passport.authenticate('json', {}),
            (req, res) => {
              res.json(req.user);
            });

module.exports = router;

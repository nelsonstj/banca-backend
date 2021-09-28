const router = require('express').Router();
const requireUser = require('../middlewares/requireUser');
const log = require('winston');
const httpHelper = require('../helpers/http');
const siscomPlanController = require('../controllers/siscomPlan');

router.use(requireUser);

router.get('', (req, res) => {
  siscomPlanController.getSiscomPlans(req.query.initials)
    .then((result) => {
      res.json(result).end();
    }).catch((err) => {
      log.error(err);
      httpHelper.errorResponse(res);
    });
});

router.get('/all', (req, res) => {
  siscomPlanController.getSiscomPlans("")
    .then((result) => {
      res.json(result).end();
    }).catch((err) => {
      log.error(err);
      httpHelper.errorResponse(res);
    });
});

module.exports = router;

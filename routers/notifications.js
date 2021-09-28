const router = require('express').Router();
const log = require('winston');

const httpHelper = require('../helpers/http');
const notificationController = require('../controllers/notification');


router.post('/subscribe', (req, res) => {
  notificationController.subscribe({
    token: req.body.token,
  })
    .then(() => res.status(201).end())
    .catch((err) => {
      log.error(err);
      httpHelper.errorResponse(res);
    });
});

module.exports = router;

const log = require('../helpers/log').logger;
const router = require('express').Router();
const requireUser = require('../middlewares/requireUser');
const UserBusiness = require("../business/user");
const userController = require('../controllers/user');
const httpHelper = require('../helpers/http');

router.use(requireUser);

router.put('/:username/group/:group_id', (req, res) => {
  userController.update({
    username: req.params.username,
    data: { group: req.params.group_id },
  })
  .then(() => { res.status(204).json(); })
  .catch((err) => {
    if (err.status === 404) {
      httpHelper.notFoundResponse(res);
    } else {
      httpHelper.errorResponse(res);
    }
  });
});

router.get('/me', (req, res) => {
  userController.get({ username: req.user.username })
    .then(result => { res.json(result); });
});

router.get('/usercrm', (req, res) => {
  log.info('userCrm -> getUserCrm');
  const userBusiness = new UserBusiness({});
  userBusiness.getUserCrm(req.user.email)
    .then((scope) => { userBusiness.enviarResposta(res, 200, scope.usercrm); })
    .catch((err) => { userBusiness.errorHandler(err, res); });
});

router.get('/usercrmroles', (req, res) => {
  log.info('userCrm -> getUserCrmRoles');
  const userBusiness = new UserBusiness({});
  userBusiness.getUserCrmRoles(req.user.email)
    .then((scope) => { userBusiness.enviarResposta(res, 200, scope.roles); })
    .catch((err) => { userBusiness.errorHandler(err, res); });
});

router.get('/:username', (req, res) => {
  userController.get({ username: req.params.username })
    .then((result) => { res.json(result); });
});

module.exports = router;

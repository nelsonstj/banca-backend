const log = require('../helpers/log').logger;
const userController = require('../controllers/user');
const groupController = require('../controllers/group');

module.exports = function requireUser(req, res, next) {
  log.info('requireUserMiddlewares');
  if (req.user) {
    userController.get({ username: req.user.username })
      .then(userData => (userData.group ? groupController.getGroup({ id: userData.group }) : Promise.resolve(null)))
      .catch(err => {
        log.error(err);
        return res.status(403);
      });
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

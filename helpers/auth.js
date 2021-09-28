const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('config');
const bluebird = require('bluebird');
const JsonStrategy = require('passport-json').Strategy;
const log = require('../helpers/log').logger;

const SisComClient = require('./siscom').SisComClient;


const JWT_SECRET = 'pl1m-pl1m!';
const verifyJWT = bluebird.promisify(jwt.verify);

const verifyToken = token => verifyJWT(token, JWT_SECRET);
exports.verifyToken = verifyToken;

function _serializeUser(user, done) {
  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: config.get('session.expiration'),
  });
  log.debug('Auth -> serializeUser token: ' + token);
  done(null, token);
}

function _deserializeUser(token, done) {
  // TODO: retrieve user in the database
  log.debug('Auth -> deserializeUser token: ' + token);
  verifyToken(token)
    .then((userData) => {
      log.debug('Auth -> deserializeUser userData');
      done(null, userData);
    })
    .catch(jwt.TokenExpiredError, (err) => {
      log.error('Auth -> TokenExpiredError');
      log.warn(err);
      done(null, false);
    })
    .catch((err) => {
      log.error('Auth -> Random error');
      log.error(err);
      done(err);
    });
}

const _loginValidation = (siscomClient, userController) => (username, password, done) => {
  log.info(`Auth -> _loginValidation`);
  if (!username || !password) {
    log.info(`Auth -> User login empty`);
    return done(null, false);
  }
  return siscomClient.login(username, password)
    .then(() => {
      log.info(`Auth -> User login atempt:  ${username}`);
      userController.get({ username: username }).then((result) => {
        let userData = {};
        userData.username = result.username ? result.username : null;
        userData.group = result.group ? result.group : null;
        userData.className = result.className;
        userData.email = result.email ? result.email : null;
        log.info(`Auth -> User login succedded:  ${username}`);
        return done(null, userData);
      })
    }).catch(() => {
      log.info(`Auth -> login failed:  ${username}`);
      done(null, false)
    });
};

function _makeStrategy(siscomConfig, userController) {
  log.debug('Auth -> Initializing client to handle Sis.com API');
  const siscomClient = new SisComClient(
    siscomConfig.base_url,
    siscomConfig.encryption_key,
    siscomConfig.encryption_algorithm,
    siscomConfig.password_length_limit
  );
  return new JsonStrategy(_loginValidation(siscomClient, userController));
}

exports.configureAuth = function configureAuth({ siscomConfig, userController }) {
  log.debug('Auth -> Setting up authentication.');
  passport.use(_makeStrategy(siscomConfig, userController));
  passport.serializeUser(_serializeUser);
  passport.deserializeUser(_deserializeUser);
};

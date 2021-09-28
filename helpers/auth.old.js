const http = require('http');

const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('config');
const bluebird = require('bluebird');
const log = require('winston');
const JsonStrategy = require('passport-json').Strategy;

const SisComClient = require('./siscom').SisComClient;


const JWT_SECRET = 'pl1m-pl1m!';
const verifyJWT = bluebird.promisify(jwt.verify);

const verifyToken = token => verifyJWT(token, JWT_SECRET);
exports.verifyToken = verifyToken;

function _serializeUser(user, done) {
  console.log(user);

  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: config.get('session.expiration'),
  });
  done(null, token);
}


function _deserializeUser(token, done) {
  // TODO: retrieve user in the database
  log.debug(token);
  verifyToken(token)
    .then((userData) => {
      log.debug('userData debug', userData);
      done(null, userData);
    })
    .catch(jwt.TokenExpiredError, (err) => {
      log.error('TokenExpiredError');
      log.warn(err);
      done(null, false);
    })
    .catch((err) => {
      log.error('Random error');
      log.error(err);
      done(err);
    });
}


const _loginValidation = (siscomClient, userController) => (username, password, done) => {
  if (!username || !password) {
    return done(null, false);
  }
  return siscomClient.login(username, password)
    .then(() => {
      userController.get({ username: username })
                    .then(result =>  {
                      if (result.username && result.group){
                         console.log('achou no Sis.com e no es', result.username);
                         return done(null, { username: result.username, group: result.group });
                      } 
    })})
    .catch((error) => {
        // console.log('username na whitelist', username);
        userController.isUserWhitelist({username})
          .then((result) => {
           if (!!result[0]){
              return done(null, { username: result[0].username });
           } else {
              return done(null, false);
           }
        });
      // log.error('Got error while trying to login to siscom: ', error.error);
      // switch (error.code) {
      //   case 401:
      //     done(null, false);
      //     break;
      //   default:
      //     done(http.STATUS_CODES[500]);
      //     break;
      // }
    });
};

function _makeStrategy(siscomConfig, userController) {
  log.debug('Initializing client to handle Sis.com API');
  const siscomClient = new SisComClient(
    siscomConfig.base_url,
    siscomConfig.encryption_key,
    siscomConfig.encryption_algorithm,
    siscomConfig.password_length_limit
  );
  return new JsonStrategy(_loginValidation(siscomClient, userController));
}

exports.configureAuth = function configureAuth({ siscomConfig, userController }) {
  log.debug('Setting up authentication.');
  passport.use(_makeStrategy(siscomConfig, userController));

  passport.serializeUser(_serializeUser);
  passport.deserializeUser(_deserializeUser);
};

const config = require('config');
const log = require("../helpers/log").logger;
const Promise = require('bluebird');
const cfgCrmGo = config.get('crmGo'); //config
const DynamicsWebApi = require('dynamics-web-api');
const AuthenticationContext = require('adal-node').AuthenticationContext;
const userController = require('../controllers/user');

const adalContext = new AuthenticationContext(cfgCrmGo.authorityUrl);

let _dynamicsWebApiI = new DynamicsWebApi({
  webApiUrl: cfgCrmGo.webApiUrl,
  onTokenRefresh: acquireToken,
  impersonate: cfgCrmGo.impersonate,
  useEntityNames: true
});

let _dynamicsWebApi = new DynamicsWebApi({
  webApiUrl: cfgCrmGo.webApiUrl,
  onTokenRefresh: acquireToken,
  useEntityNames: true
  // impersonate: cfgCrmGo.impersonate,
  // includeAnnotations: "OData.Community.Display.V1.FormattedValue",
  // webApiVersion: "8.2",
  // returnRepresentation: true,
  // maxPageSize: 10
});

function acquireToken(dynamicsWebApiCallback) {
  // a callback for adal-node
  function adalCallback(error, token) { 
    // log.debug('CrmHelper -> acquireToken -> token: ' + token.accessToken);
    if (!error) { // call DynamicsWebApi callback only when a token has been retrieved
      dynamicsWebApiCallback(token);
    } else {
      log.debug('Token has not been retrieved. Error: ' + error.stack);
    }
  }
  // call a necessary function in adal-node object to get a token
  // adalContext.acquireTokenWithUsernamePassword(resource, username, password, clientId, adalCallback);
  adalContext.acquireTokenWithClientCredentials(cfgCrmGo.resource, cfgCrmGo.clientId, cfgCrmGo.clientSecret, adalCallback);
}

module.exports = {
  dynamicsWebApiI: _dynamicsWebApiI,
  dynamicsWebApi: _dynamicsWebApi
};

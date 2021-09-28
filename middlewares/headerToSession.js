const onHeaders = require('on-headers');
const _ = require('lodash');
const log = require('winston');


function encodeSession(session, encoding) {
  // Session data bytes
  const sessionData = Buffer.from(JSON.stringify(session));
  return sessionData.toString(encoding);
}

function decodeSession(encodedSession, encoding) {
  const sessionData = Buffer.from(encodedSession, encoding);
  return JSON.parse(sessionData.toString());
}

module.exports = function headerToSession(field, encoding = 'hex') {
  return function middleware(req, res, next) {
    if (req.headers[field.toLowerCase()]) {
      try {
        req.session = decodeSession(req.headers[field], encoding);
      } catch (e) {
        log.error(e);
      }
    }

    // injecting updated session on headers
    onHeaders(res, () => {
      if (req.session) {
        res.set(_.capitalize(field), encodeSession(req.session, encoding));
      }
    });
    next();
  };
};

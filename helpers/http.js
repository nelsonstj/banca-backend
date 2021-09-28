const http = require('http');
const log = require("./log").logger;

const responseForStatus = statusCode => res => { 
  log.info('Http Helper -> responseForStatus');
  res.status(statusCode).json({
    message: http.STATUS_CODES[statusCode],
  });
};

const responseForStatusMsg = statusCode => (res, msg) => { 
  log.info('Http Helper -> responseForStatusMsg');
  res.status(statusCode).json({
    message: msg,
  });
};

exports.responseForStatus = responseForStatus;
exports.responseForStatusMsg = responseForStatusMsg;

exports.badRequestResponse = responseForStatusMsg(400);
exports.unauthorizedResponse = responseForStatusMsg(401);
exports.forbiddenResponse = responseForStatus(403);
exports.notFoundResponse = responseForStatus(404);
exports.errorResponse = responseForStatus(500);

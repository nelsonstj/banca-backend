const winston = require('winston');
require('winston-logrotate');
const config = require('config');
const moment = require('moment');

const tsFormat = () => moment().format('YYYY-MM-DD hh:mm:ss').trim();

const _transportDebugDailyAppender = new winston.transports.Rotate({
    name: 'teste1',
    file: config.get('log.app.path.debug'),
    colorize: false,
    timestamp: tsFormat,
    json: false,
    size: config.get('log.rotation.size'),
    keep: config.get('log.rotation.keep'),
    compress: true,
    level: 'debug'
});


const _transportErrorDailyAppender = new winston.transports.Rotate({
    name: 'teste2',
    file: config.get('log.app.path.error'),
    colorize: false,
    timestamp: tsFormat,
    json: false,
    size: config.get('log.rotation.size'),
    keep: config.get('log.rotation.keep'),
    compress: true,
    level: 'error'
});


const _transportElasticDailyAppender = new (winston.transports.Rotate)({
    name: 'teste3',
    file: config.get('log.elastic.path.debug'),
    colorize: false,
    timestamp: tsFormat,
    json: false,
    size: config.get('log.rotation.size'),
    keep: config.get('log.rotation.keep'),
    compress: true,
    level: 'debug'
});

const _logger = new winston.Logger({
    transports: [
        _transportDebugDailyAppender,
        _transportErrorDailyAppender,
        new winston.transports.Console({
            level: config.get('log.level'),
            handleExceptions: false,
            json: false,
            colorize: true,
            timestamp: tsFormat
        })
    ],
    exitOnError: false
});

const _elasticLogger = new winston.Logger({
    transports: [
        _transportElasticDailyAppender
    ],
    exitOnError: false
});

module.exports = {
    logger: _logger,
    elasticLogger: _elasticLogger
};

const config = require('config');
const constantsHelper = require('../helpers/constants');

module.exports = constantsHelper.make_router('content_genders', config.get('elasticsearch'));

const config = require('config');
const constantsHelper = require('../helpers/constants');

module.exports = constantsHelper.make_router('project_types', config.get('elasticsearch'));

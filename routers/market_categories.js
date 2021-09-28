const config = require('config');
const constantsHelper = require('../helpers/constants');

module.exports = constantsHelper.make_router('market_categories', config.get('elasticsearch'));

const elasticsearch 	= require('elasticsearch');
const config 			= require('config');
const esHelper 			= require('../helpers/elastic');
const es 				= elasticsearch.Client(config.get('elasticsearch'));

const SPONSORSHIP_QUOTA_TYPES = require('./sponsorship_quota_types.json');

esHelper.createConstants('sponsorship_quota_types', SPONSORSHIP_QUOTA_TYPES, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

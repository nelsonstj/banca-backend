const elasticsearch 	= require('elasticsearch');
const config 			= require('config');
const esHelper 			= require('../helpers/elastic');
const es 				= elasticsearch.Client(config.get('elasticsearch'));

const COMMERCIAL_SCHEME = require('./commercial_scheme.json');

esHelper.createConstants('commercial_scheme', COMMERCIAL_SCHEME, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

const elasticsearch 	= require('elasticsearch');
const config 			= require('config');
const esHelper 			= require('../helpers/elastic');
const es 				= elasticsearch.Client(config.get('elasticsearch'));

const LOCAL_SPONSORSHIPS = require('./local_sponsorships.json');

esHelper.createConstants('local_sponsorships', LOCAL_SPONSORSHIPS, {
  es: es,
  config: config.get('elasticsearch.local_sponsorships')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

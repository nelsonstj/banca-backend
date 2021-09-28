const elasticsearch = require('elasticsearch');
const config 		= require('config');
const esHelper 		= require('../helpers/elastic');
const es 			= elasticsearch.Client(config.get('elasticsearch'));


const INDEX_TYPES = [
  {sigla: 'teste', indice: '123'}
];

esHelper.createConstants('conversion_index', INDEX_TYPES, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));


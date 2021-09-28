const elasticsearch = require('elasticsearch');
const config = require('config');
const esHelper = require('../helpers/elastic');
const es = elasticsearch.Client(config.get('elasticsearch'));

const REGIONS = [
  {name: 'Sudeste'},
  {name: 'Sul'},
  {name: 'Nordeste'},
  {name: 'Centro-Oeste'},
  {name: 'Norte'}
];

esHelper.createConstants('regions', REGIONS, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

const elasticsearch = require('elasticsearch');
const config = require('config');
const esHelper = require('../helpers/elastic');
const util = require('util');

const es = elasticsearch.Client(config.get('elasticsearch'));


const VERTICALS = [
  { label: 'Esporte' },
  { label: 'Notícias' },
  { label: 'Entretenimento' },
  { label: 'Geral' },
];

esHelper.createConstants('verticals', VERTICALS, {
  es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCCESS ', util.inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

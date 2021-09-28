const elasticsearch = require('elasticsearch');
const config = require('config');
const esHelper = require('../helpers/elastic');
const util = require('util');

const es = elasticsearch.Client(config.get('elasticsearch'));

const QUOTA_TYPES = [
  { area: 'tv', unique: true, abbr: 'midia', label: 'Valor de Mídia', priority: 0, required: true }, // Type 1
  { area: 'tv', unique: false, abbr: 'producao', label: 'Valor de Produção', priority: 2, required: false }, // Type 2
  { area: 'md', unique: false, abbr: 'producao', label: 'Valor de Produção', priority: 3, required: false }, // Type 3
  { area: 'tv', unique: false, abbr: 'crossmidia', label: 'Valor de Cross Mídia', priority: 4, required: false }, // Type 4
  { area: 'tv', unique: false, abbr: 'arena', label: 'Valor das Propriedades de Arena', priority: 5, required: false }, // Type 5
  { area: 'md', unique: true, abbr: 'midia', label: 'Valor de Mídia Digital por Cota', priority: 1, required: false } // Type 6
  // {area:'tv', abbr: 'arena', label: 'Outros Valores', priority: 6, required: false}
];

esHelper.createConstants('quota_types', QUOTA_TYPES, {
  es,
  config: config.get('elasticsearch')
})
  .then(result => console.log('SUCESS ', util.inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

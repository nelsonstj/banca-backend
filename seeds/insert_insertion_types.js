const elasticsearch = require('elasticsearch');
const config = require('config');
const esHelper = require('../helpers/elastic');
const es = elasticsearch.Client(config.get('elasticsearch'));

const INSERTION_TYPES = [
  {label: 'Abertura comercial', range: ['national']},
  {label: 'Encerramento comercial', range: ['national']},
  {label: 'Vinheta de passagem', range: ['national']},
  {label: 'Vinheta de Bloco', range: ['national']},
  {label: 'Comercial', range: ['national']},
  {label: 'Chamada', range: ['national']},
  {label: 'Programete', range: ['national']},
  {label: 'Clipe', range: ['national']},
  {label: 'Flash', range: ['national']},
  {label: 'Insert de vídeo', range: ['national']},
  {label: 'Total', range: ['national', 'local']}
 ];

esHelper.createConstants('insertion_types', INSERTION_TYPES, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

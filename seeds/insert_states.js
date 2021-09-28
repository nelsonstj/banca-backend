const elasticsearch = require('elasticsearch');
const config = require('config');
const esHelper = require('../helpers/elastic');
const es = elasticsearch.Client(config.get('elasticsearch'));

const STATES = [
  {initials: 'SP', name: 'São Paulo', region: '1'},
  {initials: 'RJ', name: 'Rio de Janeiro', region: '1'},
  {initials: 'ES', name: 'Espírito Santos', region: '1'},
  {initials: 'MG', name: 'Minas Gerais', region: '1'},
  {initials: 'RS', name: 'Rio Grande do Sul', region: '2'},
  {initials: 'PR', name: 'Paraná', region: '2'},
  {initials: 'SC', name: 'Santa Catarina', region: '2'},
  {initials: 'PE', name: 'Pernambuco', region: '3'},
  {initials: 'BA', name: 'Bahia', region: '3'},
  {initials: 'CE', name: 'Ceará', region: '3'},
  {initials: 'MA', name: 'Maranhão', region: '3'},
  {initials: 'PB', name: 'Paraíba', region: '3'},
  {initials: 'AL', name: 'Alagoas', region: '3'},
  {initials: 'PI', name: 'Piauí', region: '3'},
  {initials: 'SE', name: 'Sergipe', region: '3'},
  {initials: 'DF', name: 'Distrito Federal', region: '4'},
  {initials: 'GO', name: 'Goiás', region: '4'},
  {initials: 'MS', name: 'Mato Grosso do Sul', region: '4'},
  {initials: 'MT', name: 'Mato Grosso', region: '4'},
  {initials: 'PA', name: 'Pará', region: '5'},
  {initials: 'TO', name: 'Tocantins', region: '5'},
  {initials: 'AM', name: 'Amazonas', region: '5'},
  {initials: 'RO', name: 'Rondônia', region: '5'},
  {initials: 'AC', name: 'Acre', region: '5'},
  {initials: 'RR', name: 'Roraima', region: '5'},
  {initials: 'RN', name: 'Rio Grande do Norte', region: '3'},
  {initials: 'AP', name: 'Amapá', region: '5'},
 ];

esHelper.createConstants('states', STATES, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

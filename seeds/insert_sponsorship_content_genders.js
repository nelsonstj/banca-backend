const elasticsearch = require('elasticsearch');
const config = require('config');
const esHelper = require('../helpers/elastic');
const es = elasticsearch.Client(config.get('elasticsearch'));

const SPONSORSHIP_CONTENT_GENDERS = [
  {label: 'Auditório', visibility: true},
  {label: 'Carros e Motores', visibility: true},
  {label: 'Culinário', visibility: true},
  {label: 'DEBATE', visibility: true},
  {label: 'Desenho Adulto', visibility: true},
  {label: 'Documentário', visibility: true},
  {label: 'Educativo', visibility: true},
  {label: 'Entrevista', visibility: true},
  {label: 'Erótico' ,visibility: true},
  {label: 'Esporte' ,visibility: true},
  {label: 'Feminino' ,visibility: true},
  {label: 'Filme' ,visibility: true},
  {label: 'Futebol' ,visibility: true},
  {label: 'Game Show' ,visibility: true},
  {label: 'Humorístico' ,visibility: true},
  {label: 'Independente' ,visibility: true},
  {label: 'Infantil' ,visibility: true},
  {label: 'Jornalismo' ,visibility: true},
  {label: 'Making Of' ,visibility: true},
  {label: 'Minissérie' ,visibility: true},
  {label: 'Moda E Beleza' ,visibility: true},
  {label: 'Musical', visibility: true},
  {label: 'Não Consta' ,visibility: true},
  {label: 'Novela' ,visibility: true},
  {label: 'Político' ,visibility: true},
  {label: 'Premiação' ,visibility: true},
  {label: 'Reality Show' ,visibility: true},
  {label: 'Religioso', visibility: true},
  {label: 'Reportagem' ,visibility: true},
  {label: 'Rural' ,visibility: true},
  {label: 'Saúde' ,visibility: true},
  {label: 'Série' ,visibility: true},
  {label: 'Show' ,visibility: true},
  {label: 'Sorteio' ,visibility: true},
  {label: 'Televendas' ,visibility: true},
  {label: 'Viagem e Turismo' ,visibility: true},

];

esHelper.createConstants('sponsorship_content_genders', SPONSORSHIP_CONTENT_GENDERS, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

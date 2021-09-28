const elasticsearch = require('elasticsearch');
const config = require('config');
const esHelper = require('../helpers/elastic');
const es = elasticsearch.Client(config.get('elasticsearch'));

const CONTENT_GENDERS = [
  {label: 'Auditório', associatedTo: ['program'], visibility: true},
  {label: 'Carros e Motores', associatedTo: ['program'], visibility: true},
  {label: 'Social/Comunitário', associatedTo: ['event','break'], visibility: true},
  {label: 'Culinário', associatedTo: ['program'], visibility: true},
  {label: 'Cultural/Folclórico', associatedTo: ['event','break'], visibility: true},
  {label: 'DEBATE', associatedTo: ['program'], visibility: true},
  {label: 'Desenho Adulto', associatedTo: ['program'], visibility: true},
  {label: 'Documentário', associatedTo: ['program'], visibility: true},
  {label: 'Educativo', associatedTo: ['event','break', 'program'], visibility: true},
  {label: 'Entrevista', associatedTo: ['program'], visibility: true},
  {label: 'Erótico', associatedTo: ['program'], visibility: true},
  {label: 'Esporte', associatedTo: ['program'], visibility: true},
  {label: 'Esportivo', associatedTo: ['event','break'], visibility: true},
  {label: 'Feiras', associatedTo: ['event','break'], visibility: true},
  {label: 'Feminino', associatedTo: ['program'], visibility: true},
  {label: 'Filme', associatedTo: ['program'], visibility: true},
  {label: 'Futebol', associatedTo: ['program'], visibility: true},
  {label: 'Game Show', associatedTo: ['program'], visibility: true},
  {label: 'Gastronômico', associatedTo: ['event','break'], visibility: true},
  {label: 'Humorístico', associatedTo: ['program'], visibility: true},
  {label: 'Independente', associatedTo: ['program'], visibility: true},
  {label: 'Infantil', associatedTo: ['program'], visibility: true},
  {label: 'Institucional', associatedTo: ['event','break'], visibility: true},
  {label: 'Jornalismo', associatedTo: ['program'], visibility: true},
  {label: 'Making Of', associatedTo: ['program'], visibility: true},
  {label: 'Minissérie', associatedTo: ['program'], visibility: true},
  {label: 'Moda E Beleza', associatedTo: ['program'], visibility: true},
  {label: 'Musical', associatedTo: ['event','break', 'program'], visibility: true},
  {label: 'Não Consta', associatedTo: ['program'], visibility: true},
  {label: 'Novela', associatedTo: ['program'], visibility: true},
  {label: 'Político', associatedTo: ['program'], visibility: true},
  {label: 'Premiação', associatedTo: ['program'], visibility: true},
  {label: 'Reality Show', associatedTo: ['program'], visibility: true},
  {label: 'Religioso', associatedTo: ['event','break', 'program'], visibility: true},
  {label: 'Reportagem', associatedTo: ['program'], visibility: true},
  {label: 'Rural', associatedTo: ['program'], visibility: true},
  {label: 'Agronegócio', associatedTo: ['event','break'], visibility: true},
  {label: 'Saúde', associatedTo: ['program'], visibility: true},
  {label: 'Série', associatedTo: ['program'], visibility: true},
  {label: 'Show', associatedTo: ['program'], visibility: true},
  {label: 'Sorteio', associatedTo: ['program'], visibility: true},
  {label: 'Televendas', associatedTo: ['program'], visibility: true},
  {label: 'Turismo', associatedTo: ['event','break'], visibility: true},
  {label: 'Viagem e Turismo', associatedTo: ['program'], visibility: true},
  {label: 'Aniversário de Cidade', associatedTo: ['event','break'], visibility: true},
  {label: 'Ecológico/Sustentabilidade', associatedTo: ['event','break'], visibility: true},
  {label: 'Festas Juninas', associatedTo: ['event','break'], visibility: true},
  {label: 'Moda', associatedTo: ['event','break'], visibility: true},
  {label: 'Pet', associatedTo: ['event','break'], visibility: true},
  {label: 'Verão', associatedTo: ['event','break'], visibility: true}
];

esHelper.createConstants('content_genders', CONTENT_GENDERS, {
  es: es,
  config: config.get('elasticsearch')
}).then(result => console.log('SUCESS ', require('util').inspect(result, { depth: null })))
  .catch(err => console.error('ERROR ', err));

const elasticsearch = require('elasticsearch');
const moment        = require('moment');
const inspect       = require('eyes').inspector({maxLength: 200000 });
const bodybuilder   = require('bodybuilder');
const config        = require('config');
const esHelper      = require('../helpers/elastic');
const es            = elasticsearch.Client(config.get('elasticsearch'));


var bob = bodybuilder()
  .query('range', 'created_at', { gte: "2017-06-01T00:00:00.000", lte: "2017-06-25T00:00:00.000" })
  .build();


inspect(bob,'query');


es.search({
      index: 'banca',
      type: 'projects',
      body: bob
    }).then(function(data){
      inspect(data,'resultado original');
      data.hits.hits.map(function(resultado){
        if (resultado._source.commercialization_limit){
          inspect(resultado._source.commercialization_limit,'commercialization_limit');
          console.log(convertDataPlease(resultado._source.commercialization_limit));
          console.log('---');
          resultado._source.commercialization_limit = convertDataPlease(resultado._source.commercialization_limit);
        }
      });
      inspect(resultado, 'resultado alterado');
    })

function convertData(timestamp){
  return moment(timestamp).utcOffset("-03:00").format();
  //return moment(timestamp).utcOffset("-03:00").format();
}

function convertDataNoTZ(timestamp){
  let _data = moment(timestamp).utcOffset("-03:00");
  return moment({year :_data.year(), month :_data.month(), day :_data.day(), hour :_data.hour(), minute :_data.minute(), second :_data.second()}).format('YYYY-MM-DDTHH:MM:SS');
}

function convertDataPlease(timestamp){
  return moment(timestamp).utcOffset("-03:00").format("YYYY-MM-DDTHH:mm:ss.SSS").toString() + 'Z';
}



const got = require('got');
const _ = require('lodash');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1', credentials: new AWS.Credentials("???", "???") });

const ES_HOST = 'https://search-bancadev-???.us-east-1.es.amazonaws.com';

const SISCOM_HOST = "https://???"; 

function getPrograms() {
  return got(SISCOM_HOST, {
    headers: {
      Authorization: '???',
    },
  }).then(data => {
    console.log("Dados de programas obtidos no SIS.COM.");
    return JSON.parse(data.body);
  });
}

function insertPrograms(data, client) {
  const resultArray = [];

  const body = data.response.forEach(element => {
    resultArray.push({ index: { _index: 'siscom_programs', _type: 'siscom_program', _id: element.Id } });
    resultArray.push(_.assign({ updatedAt: new Date() }, element));
  });

  return client.bulk({ body: resultArray });
}

exports.handler = (context, event, callback) => getPrograms()
  .then((data) => {
    const client = require('elasticsearch').Client({
      hosts: [ES_HOST],
      connectionClass: require('http-aws-es'),
      log: 'error'
    });

    console.log("Iniciando entrada de dados de programas do SIS.COM.");
    return insertPrograms(data, client);
  })
  .then(() => {
    console.log('Dados de programas do SIS.COM inseridos no ES com sucesso.');
    callback(null, "Dados de programas do SIS.COM registrados com sucesso.")
  })
  .catch((error) => {
    console.error("Ocorreu um erro na inserção de dados de programas do SIS.COM:", error);
    callback(error);
  });

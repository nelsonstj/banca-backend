const got = require('got');
const _ = require('lodash');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1', credentials: new AWS.Credentials("???", "???") });

function getUsers() {
  return got('http://???', {
    headers: {
      Authorization: '????',
    },
  }).then(data => {
    console.log("Dados de usuários obtidos no SIS.COM.");
    return JSON.parse(data.body);
  });
}

function insertUsers(users, client) {
  const siscomUsers = [];

  users.response.forEach((element) => {
    siscomUsers.push({
      update: {
        _index: 'siscom_users', _type: 'siscomUsers', _id: element.siscomUsername,
      },
    });
    siscomUsers.push({
      doc_as_upsert: true,
      doc: {
        username: element.siscomUsername, name: element.fullName, email: element.email,
      },
    });
  });

  return client.bulk({ body: siscomUsers });
}

exports.handler = (context, event, callback) => getUsers()
  .then((data) => {
    const client = require('elasticsearch').Client({
      hosts: ['https://search-bancadev-???.us-east-1.es.amazonaws.com'],
      connectionClass: require('http-aws-es'),
      log: 'error'
    });

    console.log("Iniciando entrada de dados de usuários do SIS.COM.");
    return insertUsers(data, client);
  })
  .then(() => {
    console.log('Dados de usuários do SIS.COM inseridos no ES com sucesso.');
    callback(null, "Dados de usuários do SIS.COM registrados com sucesso.");
  })
  .catch((error) => {
    console.error("Ocorreu um erro na inserção de dados de usuários do SIS.COM:", error);
    callback(error);
  });
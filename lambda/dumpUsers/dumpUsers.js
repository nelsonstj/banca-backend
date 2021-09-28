const got = require('got');
const _ = require('lodash');
const AWS = require('aws-sdk');
const fs = require('fs');

const client = require('elasticsearch').Client({
  hosts: ['https://search-bancas-prod-???.us-east-1.es.amazonaws.com'],
  connectionClass: require('http-aws-es'),
  log: 'error'
});

AWS.config.update({ region: 'us-east-1', credentials: new AWS.Credentials("???", "???") });

function getUsers() {
  return got('https://???', {
    headers: {
      Authorization: '???',
    },
  }).then(data => {
    console.log("Dados de usuários obtidos no SIS.COM.");
    return JSON.parse(data.body).response;
  }).catch((err) => {
    console.log(err);
  });
}


function getUsersFromBanca() {

  return new Promise((resolve) => {
    let allUsers = [];
    client.search({
      index: 'siscom_users',
      type: 'siscomUsers',
      size: 10000,
      scroll: '30s',
      body: {
        query: {
          match_all: {}
        }
      }
    }, function getMoreUntilDone(error, response) {
      response.hits.hits.forEach(function (hit) {
        allUsers.push(hit._source);
      });

      if (response.hits.total > allUsers.length) {
        // ask elasticsearch for the next set of hits from this search
        client.scroll({
          scrollId: response._scroll_id,
          scroll: '30s'
        }, getMoreUntilDone);
      } else {
        resolve(allUsers);
      }
    })
  })


}

function insertUsers(userst) {
  const arrayPromises = [];
  userst.forEach((element) => {

    arrayPromises.push(
      client.update({
        index: 'siscom_users',
        type: 'siscomUsers',
        id: element.siscomUsername,
        body: {
          doc_as_upsert: true,
          doc: {
            username: element.siscomUsername, name: element.fullName, email: element.email, active: true,
          },
        }
      }));

    fs.writeFileSync(__dirname + '/bulkInsercao.txt', JSON.stringify(element));
  });

  return Promise.all(arrayPromises)
}

function removeUsers(users) {
  const arrayPromises = [];

  users.forEach((element) => {
    arrayPromises.push(
      client.update({
        index: 'siscom_users',
        type: 'siscomUsers',
        id: element.username,
        body: {
          doc: {
            username: element.username, name: element.name, email: element.email, group: element.group, active: false,
          },
        }
      }));
    fs.writeFileSync(__dirname + '/bulkRemove.txt', JSON.stringify(element));
  });

  return Promise.all(arrayPromises)
}

let users = [];

exports.handler = (context, event, callback) => getUsersFromBanca()
  .then((resp) => {
    return resp;
  }).then((usuariosBanca) => getUsers()
    .then((usuariosSiscom) => {

      let usuariosBancaMatch = _.map(usuariosBanca, (item) => {
        item.siscomUsername = item.username;
        return item;
      });

      users = _.differenceBy(usuariosBancaMatch, usuariosSiscom, 'siscomUsername');
      console.log(`Inserindo usuários do banca que não estão no SIS.COM. count: ${usuariosSiscom.length}`);
      return insertUsers(usuariosSiscom)
    })
    .then(() => {
      console.log(`Removendo usuários do banca que não estão no SIS.COM. count: ${users.length}`);
      return removeUsers(users)
    })
    .then(() => {
      console.log('Dados de usuários do SIS.COM atualizados no ES com sucesso.');
      callback(null, "Dados de usuários do SIS.COM registrados com sucesso.");
    })
    .catch((error) => {
      console.error("Ocorreu um erro na inserção de dados de usuários do SIS.COM:", error);
      callback(error);
    }));
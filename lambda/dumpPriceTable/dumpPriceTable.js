const got = require('got');
const _ = require('lodash');
const AWS = require('aws-sdk');
const moment = require('moment');
const es = require('elasticsearch');
const httpES = require('http-aws-es');

AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.Credentials(
    '???',
    '???'
  )
});

function getPriceTable(address, accessToken, date) {
  console.log('Obtendo dados da tabela de preços do SIS.COM para a data', date);

  return got(`${address}/${date}`, {
    headers: {
      Authorization: accessToken
    }
  })
    .then((data) => {
      console.log(`Dados de lista de preço obtidos no sis.com data: ${date}`);
      return JSON.parse(data.body);
    })
    .catch((error) => {
      console.error('Ocorreu um erro na inserção de dados de lista de preço do sis.com: ', error);
      return error;
    });
}

function insertPriceTable(data, client) {
  const resultArray = [];

  if (data.response.length === 0) {
    return null;
  }

  const body = data.response.filter(
    value => value.Exhibitor.toLowerCase() === 'nac' && value.IsolatedPrice
  );

  body.forEach((element) => {
    resultArray.push({
      index: {
        _index: 'siscom_pricetables',
        _type: 'siscom_pricetable',
        _id: `${element.ProgramName}_${element.Exhibitor}_${element.SubExhibitor}_${
          element.IsolatedPrice
        }_${moment(element.TableReferenceDate).format('YYYY-MM-DD')}`
      }
    });
    resultArray.push(
      _.assign(
        {
          updatedAt: new Date()
        },
        element
      )
    );
  });

  return client.bulk({ body: resultArray });
}

function doWork(address, accessToken, iteratorDate, client, index, limit, cb) {
  const formattedIteratorDate = iteratorDate.format('YYYY-MM-DD');

  return getPriceTable(address, accessToken, formattedIteratorDate)
    .then((data) => {
      console.log(
        'Iniciando entrada de lista de preço do SIS.COM para',
        `${formattedIteratorDate}.`
      );
      return insertPriceTable(data, client);
    })
    .then(() => {
      console.log(
        'Dados de lista de preço do sis.com inseridos no ES com sucesso para',
        `${formattedIteratorDate}.`
      );
      if (index >= limit) {
        cb(null, 'Operação finalizada com sucesso.');
        return false;
      }
      const objIteratorDate = iteratorDate.add(1, 'month');
      const objIndex = index + 1;
      return doWork.bind(
          null,
          address,
          accessToken,
          objIteratorDate,
          client,
          objIndex,
          limit,
          cb
        )();
    })
    .catch((error) => {
      console.error('Ocorreu um erro na inserção de dados de lista de preço do sis.com: ', error);
      cb(error);
    });
}

exports.handler = (event, context, callback) => {
  const EC2_HOST_NAME = event.ec2Host || 'http://ec2-???';
  const ES_HOST_NAME =
    event.esHost ||
    'https://search-bancas-prod-???';
  const ENDPOINT = event.endpoint || 'ComercialApps.Apresentacao/api/v1/pricetable';
  const ACCESS_TOKEN =
    event.accessToken || '???';

  let iteratorDate = moment().startOf('month');

  if (event.startDate) {
    iteratorDate = moment(event.startDate).startOf('month');
  }

  const client = es.Client({
    hosts: [ES_HOST_NAME],
    connectionClass: httpES,
    log: 'error',
    requestTimeout: 90000
  });

  const address = `${EC2_HOST_NAME}/${ENDPOINT}`;
  doWork(address, ACCESS_TOKEN, iteratorDate, client, 0, event.duration, callback);
};

const got = require('got');
const _ = require('lodash');
const AWS = require('aws-sdk');
const moment = require('moment');

AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.Credentials(
    '???',
    '???'
  )
});

const ES_HOSTNAME = 'https://search-bancas-prod-???.us-east-1.es.amazonaws.com';
const SISCOM_API_HOSTNAME = 'https://???';
const SISCOM_PLANS_ENDPOINT = 'api/v1/plans/availability';
const SISCOM_API_KEY = '????';
const ES_SISCOM_PLAN_INDEX = 'siscom_plans';
const ES_SISCOM_PLAN_TYPE = 'siscom_plan';
const PAGE_SIZE = 100;
let client = null;
let PAGE = 1;

function getPlans(queryDate, siscomHostname, plansEndpoint, page, pageSize) {
  const queryAddress = `${siscomHostname || SISCOM_API_HOSTNAME}/${plansEndpoint ||
    SISCOM_PLANS_ENDPOINT}?page=${page || PAGE}&pageSize=${pageSize || PAGE_SIZE}`;

  console.log(`Iniciando a consulta de dados de planos disponíveis do siscom: ${queryAddress}`);

  return got(queryAddress, {
    headers: {
      Authorization: SISCOM_API_KEY
    }
  })
    .then((data) => {
      const responseData = JSON.parse(data.body);

      if (responseData.response.length > 0) {
        console.log(
          'Dados de planos obtidos no SIS.COM. Quantidade de planos obtidos:',
          responseData.response.length
        );
        console.log('Primeiro plano da massa:', responseData.response[0].id);
        console.log(
          'Último plano da massa:',
          responseData.response[responseData.response.length - 1].id
        );
      }

      return responseData;
    })
    .catch((error) => {
      console.error('Ocorreu um erro na obtenção de dados de planos do sis.com: ', error);
      return error;
    });
}

function insertPlans(data) {
  const resultArray = [];

  if (data.response.length === 0) {
    return null;
  }

  data.response.forEach((element) => {
    resultArray.push({
      index: { _index: ES_SISCOM_PLAN_INDEX, _type: ES_SISCOM_PLAN_TYPE, _id: element.id }
    });
    resultArray.push(
      _.assign(
        {
          updatedAt: moment()
            .utcOffset(0, true)
            .format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        },
        element
      )
    );
  });

  return client.bulk({ body: resultArray });
}

function doWork(event, hosts, cb) {
  return getPlans(
    event.queryDate,
    event.siscomHostname,
    event.plansEndpoint,
    event.page,
    event.pageSize
  ).then((data) => {
    console.log('Inserindo dados obtidos no elasticsearch:', hosts);

    client = require('elasticsearch').Client({
      hosts: [hosts],
      connectionClass: require('http-aws-es'),
      log: 'error',
      requestTimeout: 90000
    });

    if (data.response.length > 0) {
      insertPlans(data, client).then(() => {
        const myEvent = event;
        myEvent.page += 1;
        PAGE += 1;
        return doWork.bind(null, myEvent, hosts, client, cb)();
      });
    } else {
      cb(null, 'done!');
    }
  });
}

exports.handler = (event, context, callback) => {
  // Ainda não temos o contador de páginas no backend!
  const hosts = event.esHostname || ES_HOSTNAME;

  doWork(event, hosts, callback)
    .then(() => {
      console.log('working...');
      callback(null, 'done!');
    })
    .catch((error) => {
      console.error('Ocorreu um erro na atualização de dados do SIS.COM no ES:', error);
      callback(error);
    });
};

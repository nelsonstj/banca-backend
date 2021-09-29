const AWS = require('aws-sdk');
const config = require('config');
const configCrmGo = config.get('General.crmGo');
const configSQS = config.get('General.SQS');
const DynamicsWebApi = require('dynamics-web-api');
const AuthenticationContext = require('adal-node').AuthenticationContext;
const adalContext = new AuthenticationContext(configCrmGo.authorityUrl);
let countCustomers = 0;

AWS.config.loadFromPath('./config/configaws.json');

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const queueURL = configSQS.queueUrl;
const customerItemsPerPage = 10;

let returnSucess = {
  message: '',
  details: {}
};
let returnError = {
  message: '',
  from: 'getClientsFromGoToSQS',
  details: {}
};

function acquireCRMToken(dynamicsWebApiCallback) {
  function adalCallback(error, token) {
    if (!error) {
      dynamicsWebApiCallback(token);
    } else {
      console.log('Token has not been retrieved. Error: ', error.stack);
    }
  }
  adalContext.acquireTokenWithClientCredentials(
    configCrmGo.resource,
    configCrmGo.clientId,
    configCrmGo.clientSecret,
    adalCallback
  );
}

const dynamicsWebApi = new DynamicsWebApi({
  webApiUrl: configCrmGo.webApiUrl,
  useEntityNames: true,
  onTokenRefresh: acquireCRMToken,
  count: true
});

function initializeMessageObjects() {
  returnSucess = {
    message: '',
    details: {}
  };
  returnError = {
    message: '',
    from: 'getAgenciesFromGoToSQS',
    details: {}
  };
}

function generateErrorMessage(error, message) {
  initializeMessageObjects();
  returnError.message = message;
  returnError.details = error;
  returnSucess.message = '';
  returnSucess.details = {};
  console.log(message, ' ', JSON.stringify(error));
}

function generateSuccessMessage(details, message) {
  initializeMessageObjects();
  returnError = null;
  returnSucess.message = message;
  returnSucess.details = details;
  console.log(message, ' ', JSON.stringify(details));
}

function getCustomersFromCRM() {
  let res = [];
  const request = {
    collection: 'accounts',
    select: ['name', 'accountid', '_situacao'],
    filter: '_tipoconta_value ne 7d62a70a-029c-42d8-a617-8ed5168e0d02 and statecode eq 0',
    orderBy: ['name asc'],
    count: true
  };
  return new Promise((resolve, reject) => {
    dynamicsWebApi
      .retrieveRequest(request)
      .then((response) => {
        res = response.value;
      })
      .then(() => {
        generateSuccessMessage(res, 'Clientes resgatados com sucesso do GO');
        resolve(res);
      })
      .catch((error) => {
        generateErrorMessage(error, 'Erro ao resgatar Clientes do GO');
        reject(error);
      });
  });
}

function sendCustomersToQueue(customers) {
  console.log('preparação para fila...');
  const params = { Entries: [], QueueUrl: queueURL };
  customers.forEach((customer) => {
    params.Entries.push({
      Id: customer.accountid,
      MessageBody: JSON.stringify(customer),
      DelaySeconds: 0
    });
  });
  console.log('Enviando ítens para a fila...', JSON.stringify(params));
  return sqs
    .sendMessageBatch(params)
    .promise()
    .then(() => {
      generateSuccessMessage(customers, 'Clientes enviados para a fila com sucesso');
      return 0;
    })
    .catch((error) => {
      generateErrorMessage(error, 'Erro ao enviar os Clientes para a fila');
      return 0;
    });
}

function paginate(arr, perPage, page) {
  const basePage = page * perPage;
  return page < 0 || perPage < 1 || basePage >= arr.length
    ? []
    : arr.slice(basePage, basePage + perPage);
}

function doWork(customers, pagingCustomers, previousPage) {
  let currentPage = previousPage;
  if (
    typeof customers !== typeof undefined &&
    countCustomers > 0 &&
    currentPage + 1 <= pagingCustomers
  ) {
    const currentPageCustomers = paginate(customers, customerItemsPerPage, currentPage);
    console.log(`Interação atual (página): ${currentPage + 1}`);
    if (currentPageCustomers.length > 0) {
      return sendCustomersToQueue(currentPageCustomers)
        .then(() => {
          currentPage += 1;
          return doWork(customers, pagingCustomers, currentPage);
        })
        .catch((error) => {
          generateErrorMessage(error, 'Erro ao executar');
          return 0;
        });
    }
  }
  return 0;
}

exports.handler = (event, context, callback) => {
  getCustomersFromCRM()
    .then((customers) => {
      countCustomers = customers.length;
      const pagingCustomers = Math.round(countCustomers / customerItemsPerPage);
      console.log(
        `preparando clientes para o envio para a fila: ${pagingCustomers} interações necessárias...`
      );
      return doWork(customers, pagingCustomers, 0);
    })
    .then(() => {
      console.log('Ítens importados: ', countCustomers);
      callback(null, JSON.stringify(returnSucess));
    })
    .catch(() => {
      callback(JSON.stringify(returnError), JSON.stringify(returnSucess));
    });
};

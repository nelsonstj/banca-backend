const AWS = require('aws-sdk');

const config = require('config');

const configCrmGo = config.get('General.crmGo');
const configSQS = config.get('General.SQS');

const DynamicsWebApi = require('dynamics-web-api');

const AuthenticationContext = require('adal-node').AuthenticationContext;

const adalContext = new AuthenticationContext(configCrmGo.authorityUrl);

let countAgencies = 0;

AWS.config.loadFromPath('./config/configaws.json');

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const queueURL = configSQS.queueUrl;
const agencyItemsPerPage = 10;

let returnSucess = {
  message: '',
  details: {}
};
let returnError = {
  message: '',
  from: 'getAgenciesFromGoToSQS',
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

function getAgenciesFromCRM() {
  let res = [];
  const request = {
    collection: 'accounts',
    select: ['name', 'accountid', 'tvglobo_situacao'],
    filter: '_tvglobo_tipoconta_value eq 7d62a70a-029c-42d8-a617-8ed5168e0d02 and statecode eq 0',
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
        generateSuccessMessage(res, 'Agências resgatadas com sucesso do GO');
        resolve(res);
      })
      .catch((error) => {
        generateErrorMessage(error, 'Erro ao resgatar Agências do GO');
        reject(error);
      });
  });
}

function sendAgenciesToQueue(agencies) {
  console.log('preparação para fila...');
  const params = { Entries: [], QueueUrl: queueURL };
  agencies.forEach((agency) => {
    params.Entries.push({
      Id: agency.accountid,
      MessageBody: JSON.stringify(agency),
      DelaySeconds: 0
    });
  });
  console.log('Enviando ítens para a fila...', JSON.stringify(params));
  return sqs
    .sendMessageBatch(params)
    .promise()
    .then(() => {
      generateSuccessMessage(agencies, 'Agências enviadas para a fila com sucesso');
      return 0;
    })
    .catch((error) => {
      generateErrorMessage(error, 'Erro ao enviar as Agências para a fila');
      return 0;
    });
}

function paginate(arr, perPage, page) {
  const basePage = page * perPage;
  return page < 0 || perPage < 1 || basePage >= arr.length
    ? []
    : arr.slice(basePage, basePage + perPage);
}

function doWork(agencies, pagingAgencies, previousPage) {
  let currentPage = previousPage;
  if (
    typeof agencies !== typeof undefined &&
    countAgencies > 0 &&
    currentPage + 1 <= pagingAgencies
  ) {
    const currentPageAgencies = paginate(agencies, agencyItemsPerPage, currentPage);
    console.log(`Interação atual (página): ${currentPage + 1}`);
    if (currentPageAgencies.length > 0) {
      return sendAgenciesToQueue(currentPageAgencies)
        .then(() => {
          currentPage += 1;
          return doWork(agencies, pagingAgencies, currentPage);
        })
        .catch((error) => {
          generateErrorMessage(error, 'Erro ao executar');
          return 0;
        });
    }
  }
  return false;
}

exports.handler = (event, context, callback) => {
  getAgenciesFromCRM()
    .then((agencies) => {
      countAgencies = agencies.length;
      const pagingAgencies = Math.round(countAgencies / agencyItemsPerPage);
      console.log(
        `preparando agências para o envio para a fila: ${pagingAgencies} interações necessárias...`
      );
      return doWork(agencies, pagingAgencies, 0);
    })
    .then(() => {
      generateSuccessMessage({}, `Finalizado. Ítens importados: ${countAgencies}`);
      callback(null, JSON.stringify(returnSucess));
    })
    .catch(() => {
      callback(JSON.stringify(returnError), JSON.stringify(returnSucess));
    });
};

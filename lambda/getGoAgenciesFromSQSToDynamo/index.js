const AWS = require('aws-sdk');
const config = require('config');
const configSQS = config.get('General.SQS');
AWS.config.loadFromPath('./config/configaws.json');
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const queueURL = configSQS.queueUrl;
const dynamodb = new AWS.DynamoDB();
let count = 0;
let returnSucess = {
  message: '',
  details: {}
};
let returnError = {
  message: '',
  from: 'getGoAgenciesFromSQSToDynamo',
  details: {}
};

function initializeMessageObjects() {
  returnSucess = {
    message: '',
    details: {}
  };
  returnError = {
    message: '',
    from: 'getGoAgenciesFromSQSToDynamo',
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

function SQSItemCount() {
  const sqsParams = {
    AttributeNames: ['ApproximateNumberOfMessages'],
    QueueUrl: queueURL
  };

  return sqs
    .getQueueAttributes(sqsParams)
    .promise()
    .then((data) => {
      const countItens = data.Attributes.ApproximateNumberOfMessages;
      return countItens;
    })
    .catch((err) => {
      generateErrorMessage(err, 'Erro ao resgatar a quantidade de mensagens na fila');
      return {};
    });
}

function readMessagesFromSQS() {
  const params = {
    QueueUrl: queueURL,
    AttributeNames: ['All'],
    MaxNumberOfMessages: '10',
    VisibilityTimeout: '10',
    WaitTimeSeconds: '1'
  };
  return sqs
    .receiveMessage(params)
    .promise()
    .then((data) => {
      if (data.Messages) {
        generateSuccessMessage(data.Messages, 'Agências lidas da fila');
        return data.Messages;
      }
      return {};
    })
    .catch((err) => {
      generateErrorMessage(err, 'Erro ao resgatar agências da fila para salvar no Dynamo');
      return {};
    });
}

function removeGoAgenciesDuplicates(originalArray) {
  const compareArray = {};
  let newArray = originalArray;
  newArray = newArray.filter((currentObject) => {
    if (currentObject.PutRequest.Item.accountid in compareArray) {
      return false;
    }
    compareArray[currentObject.PutRequest.Item.accountid] = true;
    return true;
  });
  return newArray;
}

function saveToDynamo(messages) {
  let GoAgencies = [];
  messages.forEach((message) => {
    const agency = JSON.parse(message.Body);
    GoAgencies.push({
      PutRequest: {
        Item: {
          accountid: { S: agency.accountid },
          name: { S: agency.name },
          status: { S: `${agency.tvglobo_situacao}` },
          source: { S: 'dynamics365GO' },
          enabled: { BOOL: true }
        }
      }
    });
  });
  GoAgencies = removeGoAgenciesDuplicates(GoAgencies);
  const batchRequest = {
    RequestItems: {
      GoAgencies
    }
  };
  return dynamodb
    .batchWriteItem(batchRequest)
    .promise()
    .then(() => {
      generateSuccessMessage(batchRequest, 'Agências salvas com sucesso no Dynamo');
      return messages;
    })
    .catch((err) => {
      generateErrorMessage(err, `Erro ao inserir agência no Dynamo: ${JSON.stringify(messages)}`);
      return {};
    });
}

function deleteFromSQS(messages) {
  const Entries = [];
  console.log(`messages: ${JSON.stringify(messages)}`);
  messages.forEach((message) => {
    Entries.push({
      Id: message.MessageId,
      ReceiptHandle: message.ReceiptHandle
    });
  });
  const deleteParams = {
    Entries,
    QueueUrl: queueURL
  };
  console.log(`delete params: ${JSON.stringify(deleteParams)}`);
  return sqs
    .deleteMessageBatch(deleteParams)
    .promise()
    .then((data) => {
      generateSuccessMessage(data, 'Agências removidas com sucesso da fila após processamento');
      return true;
    })
    .catch((err) => {
      generateErrorMessage(
        err,
        `Erro ao remover agências da fila após processamento: ${JSON.stringify(messages)}`
      );
      return false;
    });
}

function doWork() {
  return SQSItemCount().then((sqsItemCount) => {
    if (sqsItemCount > 0) {
      console.log('Ítens a processar: ', sqsItemCount);
      return readMessagesFromSQS()
        .then(messages => saveToDynamo(messages))
        .then(insertedMessages => deleteFromSQS(insertedMessages))
        .then(() => {
          count += 1;
          return doWork();
        });
    }
    generateSuccessMessage({}, 'Não há ítens na fila');
    return false;
  });
}

exports.handler = (event, context, callback) => {
  doWork()
    .then(() => {
      generateSuccessMessage({}, `Finalizado. Ítens importados: ${count}`);
      callback(null, JSON.stringify(returnSucess));
    })
    .catch((err) => {
      generateErrorMessage(err, 'Erro ao processar');
      callback(JSON.stringify(returnError), JSON.stringify(returnSucess));
    });
};

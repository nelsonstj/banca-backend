let AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  credentials: new AWS.Credentials(
    "???",
    "???"
  )
});
let sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
let queueURL =
  "https://sqs.???/fila_dev_banca_dynamicsgo";

exports.handler = (event, context, callback) => {
  var params = {
    Entries: [
      {
        Id: Math.floor((1 + Math.random()) * 0x10000).toString(16),
        MessageBody: createDummyObject()
      },
      {
        Id: Math.floor((1 + Math.random()) * 0x10000).toString(16),
        MessageBody: createDummyObject()
      },
      {
        Id: Math.floor((1 + Math.random()) * 0x10000).toString(16),
        MessageBody: createDummyObject()
      },
      {
        Id: Math.floor((1 + Math.random()) * 0x10000).toString(16),
        MessageBody: createDummyObject()
      },
      {
        Id: Math.floor((1 + Math.random()) * 0x10000).toString(16),
        MessageBody: createDummyObject()
      }
    ],
    QueueUrl: queueURL
  };
  var returnSucess = {
    message: "",
    details: {}
  };
  var returnError = {
    message: "",
    from: "getClientFromGoToSQS",
    details: {}
  };
  var messageSuccess = null;
  var messageError = null;

  sqs.sendMessageBatch(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      messageError = "Erro ao enviar para a fila";
      returnError.message = messageError;
      returnError.details = err;
    } else {
      console.log(data);
      messageSuccess = "Clientes enviados para a fila com sucesso!";
      returnSucess.message = messageSuccess;
      returnSucess.details = data;
    }
    callback(messageError, messageSuccess);
  });
};

function createDummyObject() {
  var msg = {
    Id: Math.floor((1 + Math.random()) * 0x10000).toString(16),
    Name: "tito" + new Date().toISOString()
  };
  return JSON.stringify(msg);
}

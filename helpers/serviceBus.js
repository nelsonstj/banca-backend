const azure = require('azure-sb');
const config = require('config');
const log = require('../helpers/log').logger;

const configIntegracao = config.get('integracao');

function ServiceBus() {
  this.queueService = azure.createServiceBusService(configIntegracao.connectionString);
  this.queueName = configIntegracao.queueName;
}

const queueName = configIntegracao.queueName;

ServiceBus.prototype.sendQueueMessage = (message, callback) => {
  log.info('ServiceBus Helpers -> sendQueueMessage');
  const msg = { body: JSON.stringify(message) };
  let queueService = azure.createServiceBusService(configIntegracao.connectionString);
  queueService.sendQueueMessage(queueName, msg, (error) => {
    if (error) return callback(error);
    log.info('ServiceBus Helpers -> queueService -> sendQueueMessage: Message was added to queue successfully');
    return callback(null);
  });
};

module.exports = ServiceBus;

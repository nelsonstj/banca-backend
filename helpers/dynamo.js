const log = require("../helpers/log").logger;
const AWS = require('aws-sdk');
const uuidV4 = require('uuid/v4');
const config = require("config");
const cfgDynamo = config.get("dynamo"); //config

AWS.config.loadFromPath(`${__dirname}/../config/credentials.json`);

function DynamoClient() {
  this.docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });
}

DynamoClient.prototype.create = function(table, item, autocreateID = false) {
  log.info("Dynamo helpers create"); // + JSON.stringify(item));
  return new Promise((resolve, reject) => {
    if (autocreateID) {
      item.id = uuidV4();
    }
    const params = {
      TableName: cfgDynamo.enviroment === "prd" ? table : table + "_" + cfgDynamo.enviroment,
      Item: item
    };
    // log.info("Dynamo helpers -> params: " + JSON.stringify(params));
    this.docClient.put(params, function(err, data) {
      if (err) {
        const error = JSON.stringify(err, null, 2);
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};

DynamoClient.prototype.update = function(table, item) {
  log.info("Dynamo helpers update");
  return new Promise((resolve, reject) => {
    const param = {
      TableName: cfgDynamo.enviroment === "prd" ? table : table + "_" + cfgDynamo.enviroment
    };
    this.read(param, item.id).then((data) => {
      const _data = JSON.parse(data);

      Object.keys(item).forEach((attr) => {
        _data.Item[attr.toString()] = item[attr.toString()];
      });

      const params = {
        TableName: params.TableName,
        Item: _data.Item
      };

      this.docClient.put(params, (err) => {
        if (err) {
          const error = JSON.stringify(err, null, 2);
          reject(error);
        } else {
          resolve(item);
        }
      });
    });
  });
};

DynamoClient.prototype.read = function(table, id) {
  log.info("Dynamo helpers read");
  return new Promise((resolve, reject) => {
    const params = {
      TableName: cfgDynamo.enviroment === "prd" ? table : table + "_" + cfgDynamo.enviroment,
      Key: {
        id
      }
    };
    this.docClient.get(params, (err, data) => {
      if (err) {
        const error = JSON.stringify(err, null, 2);
        reject(error);
      } else {
        const result = JSON.stringify(data, null, 2);
        resolve(result);
      }
    });
  });
};

DynamoClient.prototype.remove = function(table, id) { 
  log.info("Dynamo helpers remove");
  return new Promise((resolve, reject) => {
    const params = {
      TableName: cfgDynamo.enviroment === "prd" ? table : table + "_" + cfgDynamo.enviroment,
      Key: {
        id
      }
    };
    this.docClient.delete(params, (err, data) => {
      if (err) {
        const error = JSON.stringify(err, null, 2);
        reject(error);
      } else {
        const result = JSON.stringify(data, null, 2);
        resolve(result);
      }
    });
  });
};

DynamoClient.prototype.queries = function(params) {
  log.info("Dynamo helpers queries");// + JSON.stringify(params));
  return new Promise((resolve, reject) => {
    const parameters = params;
    this.docClient.query(parameters, (err, data) => {
      if (err) {
        const error = JSON.stringify(err, null, 2);
        reject(error);
      } else {
        const result = JSON.stringify(data, null, 2);
        resolve(result);
      }
    });
  });
};

DynamoClient.prototype.scanner = function(table, params) {
  log.info("Dynamo helpers scanner"); // + JSON.stringify(params));
  return new Promise((resolve, reject) => {
    const parameters = params;
    parameters.TableName = cfgDynamo.enviroment === "prd" ? table : table + "_" + cfgDynamo.enviroment;
    this.docClient.scan(parameters, (err, data) => {
      if (err) {
        const error = JSON.stringify(err, null, 2);
        reject(error);
      } else {
        const result = JSON.stringify(data);
        resolve(result);
      }
    });
  });
};

module.exports = DynamoClient;

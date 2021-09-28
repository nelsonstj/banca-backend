const log = require('./log').logger;
const logES = require('./log').elasticLogger;
const es = require('./elastic').client;
const beautify = require("json-beautify");
const uuidv1 = require('uuid/v1');

let _search = (query) => {
    let esHash = uuidv1();
    log.debug(`Using ES SEARCH  - Hash: ${esHash}`);
    logES.debug(`ES Operation Hash: ${esHash}`);
    logES.debug(`ES query: ${beautify(query, null, 2, 200)}`);
    return es.search(query)
};

let _create = (query) => {
  let esHash = uuidv1();
  log.debug(`Using ES SEARCH  - Hash: ${esHash}`);
  logES.debug(`ES Operation Hash: ${esHash}`);
  logES.debug(`ES query: ${beautify(query, null, 2, 200)}`);
  return es.create(query)
};

let _index = (query) => {
    let esHash = uuidv1();
    log.debug(`Using ES INDEX  - Hash: ${esHash}`);
    logES.debug(`ES Operation Hash: ${esHash}`);
    logES.debug(`ES query: ${beautify(query, null, 2, 200)}`);
    return es.index(query)
};

let _update = (query) => {
    let esHash = uuidv1();
    log.debug(`Using ES UPDATE  - Hash: ${esHash}`);
    logES.debug(`ES Operation Hash: ${esHash}`);
    logES.debug(`ES query: ${beautify(query, null, 2, 200)}`);
    return es.update(query)
};

let _get = (query) => {
    let esHash = uuidv1();
    log.debug(`Using ES GET  - Hash: ${esHash}`);
    logES.debug(`ES Operation Hash: ${esHash}`);
    logES.debug(`ES query: ${beautify(query, null, 2, 200)}`);
    return es.get(query)
};

let _bulk = (body) => {
    let esHash = uuidv1();
    log.debug(`Using ES BULK  - Hash: ${esHash}`);
    logES.debug(`ES Operation Hash: ${esHash}`);
    return es.bulk(body)
};

module.exports = {
    search : _search,
    create : _create,
    index : _index,
    update : _update,
    get : _get,
    bulk : _bulk
};
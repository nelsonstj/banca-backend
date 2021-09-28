const bodybuilder = require('bodybuilder');
const _ = require('lodash');
const es = require('../helpers/esOperation');

const CONVERSION_INDEX = 'conversion_index';

exports.get = (programName) => {
  const bob = bodybuilder();
  bob.query("match", "sigla", programName.toLowerCase());

  return es.search({
    index: "banca",
    type: CONVERSION_INDEX,
    body: bob.from(0).size(50).build()
  }).then(result => result.hits.hits.map((value) => {
    return value._source;
  }));
};

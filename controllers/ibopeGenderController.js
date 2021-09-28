const bodybuilder = require('bodybuilder');
const _ = require('lodash');

const IBOPE_GENDERS = 'genders_ibope';

exports.get = (es) => {
  const bob = bodybuilder();

  return es.search({
    index: "banca",
    type: IBOPE_GENDERS,
    body: bob.from(0).size(10000).build()
  }).then(result => result.hits.hits.map((value) => {
    return value._source;
  }));
};

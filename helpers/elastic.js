const _ = require('lodash');
const config = require('config');
const elasticsearch = require('elasticsearch');

// singleton Elastic Client
let Elastic = (function () {
    this.conf = config.get('elasticsearch');
    this.client = new elasticsearch.Client(this.conf);

    return this;
})();

module.exports = Elastic;



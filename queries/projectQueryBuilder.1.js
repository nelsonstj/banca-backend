const sort = require('./sort');
const phraseQueries = require('./phrase');
const publishedQueries = require('./published');
const ownershipQueries = require('./ownership');
const exhibitorsQueries = require('./exhibitors');
const siscomQuotaQueries = require('./siscomQuota');
const productTypeQueries = require('./projectType');
const exhibitionIntervalQueries = require('./exhibitionInterval');

let projectQueryBuilder = function (bob) {
  this.bob = bob;
};

projectQueryBuilder.prototype.queryProjectType = function (filters) {
  this.bob = productTypeQueries.queryProjectType(this.bob)(filters.ft_project_type);
  return this;
};

module.exports = projectQueryBuilder;
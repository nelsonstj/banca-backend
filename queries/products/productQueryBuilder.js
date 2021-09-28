const sort = require('./sort');
const phraseQueries = require('./phrase');
const publishedQueries = require('./published');
const ownershipQueries = require('./ownership');
const exhibitorsQueries = require('./exhibitors');
const siscomQuotaQueries = require('./siscomQuota');
const productTypeQueries = require('./productType');
const projectTypeQueries = require('../projectType');
const exhibitionIntervalQueries = require('./exhibitionInterval');

const productQueryBuilder = function (bob) {
  this.bob = bob;
};

productQueryBuilder.prototype.sortResultBySource = function (source) {
  this.bob = sort.sortResultBySource(this.bob)(source);
  return this;
};

productQueryBuilder.prototype.sortResultByAvailability = function () {
  this.bob = sort.sortResultByAvailability(this.bob);
  return this;
};

productQueryBuilder.prototype.queryExhibitionInterval = function (filters) {
  this.bob = exhibitionIntervalQueries.exhibitionInterval(this.bob)(
    filters.ft_start_date,
    filters.ft_end_date
  );
  return this;
};

productQueryBuilder.prototype.queryExhibitors = function (filters, exhibitorCodes) {
  this.bob = exhibitorsQueries.queryExhibitors(this.bob)(
    exhibitorCodes,
    filters.ft_available_quota
  );
  return this;
};

productQueryBuilder.prototype.queryAvailableSiscomQuota = function (filters) {
  this.bob = siscomQuotaQueries.queryAvailableQuota(this.bob)(
    filters.ft_available_quota,
    filters.ft_exhibitor
  );
  return this;
};

productQueryBuilder.prototype.queryMatchPhrase = function (phrase) {
  this.bob = phraseQueries.queryPhrase(this.bob)(phrase);
  return this;
};

productQueryBuilder.prototype.queryPublished = function (published) {
  this.bob = publishedQueries.queryPublishedStatus(this.bob)(published);
  return this;
};

productQueryBuilder.prototype.queryOwnership = function (filters) {
  if (!!filters.userDetails && !!filters.userDetails.group) {
    this.bob = ownershipQueries.queryCurrentOwnership(this.bob)(
      filters.ft_published,
      filters.userDetails.group
    );
  } else {
    this.bob = ownershipQueries.queryCurrentOwnership(this.bob)(filters.ft_published);
  }

  return this;
};

productQueryBuilder.prototype.queryProductType = function (filters) {
  this.bob = productTypeQueries.queryProductType(this.bob)(
    filters.ft_product_range,
    filters.ft_product_type,
    filters.ft_associated_to
  );
  return this;
};

productQueryBuilder.prototype.queryProjectType = function (filters) {
  this.bob = projectTypeQueries.queryProjectType(this.bob)(filters.ft_project_type);
  return this;
};

module.exports = productQueryBuilder;

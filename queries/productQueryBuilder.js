const _ = require('lodash');
const moment = require('moment');
const inspect = require('eyes').inspector({ maxLength: 200000 });

let productQueryBuilder = function (bob) {
  this.bob = bob;
};

productQueryBuilder.prototype.sortResultBySource = function (source) {
  if (source == 'cms') {
    this.bob.sort('updated_at', 'desc');
  }
  else {
    this.bob.sort('priorityDate');
    this.bob.sort('main_type');
  }

  return this;
}

productQueryBuilder.prototype.sortResultByAvailability = function () {
  this.bob.sort('siscom_data.availabilityStart', 'desc');
  return this;
}

productQueryBuilder.prototype.queryExhibitors = function (filters, exhibitors) {
  if (filters.ft_exhibitor && filters.ft_available_quota) {
    if (exhibitors.length > 0) {
      if (exhibitors.length == 1) {
        if (JSON.parse(filters.ft_available_quota)) {
          this.bob.query('match', 'siscom_data.availableExhibitors', exhibitors[0]);
        }
        else {
          this.bob.query('bool', 'should', [{
            'match': {
              'siscom_data.unavailableExhibitors': exhibitors[0]
            }
          }, {
            'match': {
              'siscom_data.queueExhibitors': exhibitors[0]
            }
          }]);
        }
      }
      else {
        let components = [];
        exhibitors.forEach((value) => {
          if (JSON.parse(filters.ft_available_quota)) {
            components.push({ 'match': { 'siscom_data.availableExhibitors': value } });
          }
          else {
            components.push({
              "bool": {
                "should": [{
                  'match': {
                    'siscom_data.unavailableExhibitors': value
                  }
                }, {
                  'match': {
                    'siscom_data.queueExhibitors': value
                  }
                }]
              }
            });
          }
        });

        this.bob.query("bool", "should", components);
      }
    }
  }
  else {
    if (exhibitors.length > 0) {
      if (exhibitors.length == 1) {
        this.bob.query('match', 'siscom_data.quotas.location', exhibitors[0]);
      }
      else {
        let components = [];
        exhibitors.forEach((value) => {
          components.push({ "match": { "siscom_data.quotas.location": value } });
        });

        this.bob.query("bool", "should", components);
      }
    }
  }

  return this;
}

productQueryBuilder.prototype.queryAvailableSiscomQuota = function (filters) {
  let hoje = moment().utc().format("YYYY-MM-DD");

  if (_.isNil(filters.ft_available_quota) || filters.ft_exhibitor) {
    return this;
  }

  if (JSON.parse(filters.ft_available_quota)) {
    this.bob.query('bool', "must", [{
      "bool": {
        "should": [{
          "match": {
            "siscom_data.isAvailable": filters.ft_available_quota
          }
        }, {
          "match": {
            "digital_media.isAvailable": true
          }
        }]
      }
    }]);
  }
  else {
    this.bob.query('bool', "must", [{
      "bool": {
        "should": [{
          "match": {
            "siscom_data.isAvailable": filters.ft_available_quota
          }
        }, {
          "match": {
            "digital_media.isAvailable": false
          }
        }]
      }
    }]);
  }

  return this;
}

productQueryBuilder.prototype.queryMatchPhrase = function (phrase) {
  if (phrase) {
    // Campos que devem ser considerados na consulta devem ser incluídos aqui!
    // Adicionar campos: patrocinadores anteriores, sigla do programa
    const fields = ["name", "description", "siscom_data.soldQuota.clientName",
      "local.program_initials", "national.program_initials", "sponsors"]

    // Montagem dos elementos para inserção no "should" do ES para consulta por termo.
    const searchFields = fields.reduce((prev, current) => {
      let element = {};
      element[current] = phrase;
      return prev.concat([{ "match_phrase_prefix": element }]);
    }, []);

    this.bob.query('bool', 'must', [{
      "bool": {
        "should": searchFields
      }
    }]);
  }

  return this;
};

productQueryBuilder.prototype.queryPublished = function (published) {
  this.bob.query("bool", "must", { "match": { "published": published } });
  return this;
}

productQueryBuilder.prototype.queryOwnership = function (filters, published) {
  let ownership = [];

  if (!!filters.userDetails && !!filters.userDetails.group) {
    ownership = [{
      "match": { "owner": filters.userDetails.group }
    }, {
      "match": { "holder": filters.userDetails.group }
    }];
  }

  if (!_.isNil(published)) {
    ownership.push({
      "match": { "published": published }
    });
  }

  if (ownership.length > 0) {
    this.bob.filter("bool", "should", ownership);
  }

  return this;
};

productQueryBuilder.prototype.queryTimeInterval = function (filters) {
  let dateFilter = {};

  if (filters.ft_start_date) {
    dateFilter.gte = moment.utc(filters.ft_start_date, moment.ISO_8601).format("YYYY-MM-DD");
  } else {
    filters.ft_start_date = moment(new Date).utc().format("YYYY-MM-DD");
    dateFilter.gte = moment(new Date).utc().format("YYYY-MM-DD");
  }

  if (filters.ft_end_date) {
    dateFilter.lte = moment.utc(filters.ft_end_date, moment.ISO_8601).format("YYYY-MM-DD");
  } else {
    dateFilter.lte = null;
  }

  if (filters.ft_start_date || filters.ft_end_date) {
    dateFilter.format = "yyyy-MM-dd";
    this.bob.query('bool', "should", [{
      "range": {
        "priorityDate": {
          "gte": dateFilter.gte,
          "lte": dateFilter.lte,
          "format": "yyyy-MM-dd"
        }
      }
    },
    {
      "bool": {
        "must_not": {
          "exists": {
            "field": "priorityDate"
          }
        }
      }
    }
    ]);
  }

  return this;
}

productQueryBuilder.prototype.queryProductType = function (filters) {
  let isProject = false;

  // filter searches based on project "type" from now on
  if (_.indexOf(filters.ft_product_type, "project") != -1) {
    isProject = true;
  }

  let queryIndexes = [];
  let components = [];

  if (isProject) {
    if (filters.ft_product_range.length == 1) {
      components.push({ 'match': { 'main_type': filters.ft_product_range[0] } });
    }
    else {
      filters.ft_product_range.forEach((value) => {
        components.push({ "match": { "main_type": value } });
      });
    }

    queryIndexes.push({ "type": { "value": "projects" } });
  }

  if (_.indexOf(filters.ft_product_type, "sponsorship") != -1 ||
    (!!filters.ft_associated_to && filters.ft_associated_to.toLowerCase() === "programa")) {

    inspect(filters.ft_product_rangem,'filters.ft_product_range');
    
    let sponsorshipRanges = _.filter(filters.ft_product_range.map(value => {
      switch (value) {
        case "national":
          return "national_sponsorship";
        case "local":
          return "net_sponsorship";
        default:
          break;
      }
    }), e => typeof e !== "undefined");

    if (sponsorshipRanges.length == 1) {
      components.push({ 'match': { 'main_type': sponsorshipRanges[0] } });
    }
    else {
      sponsorshipRanges.forEach((value) => {
        components.push({ "match": { "main_type": value } });
      });
    }

    queryIndexes.push({ "type": { "value": "net_sponsorships" } });
    queryIndexes.push({ "type": { "value": "sponsorships" } });
    queryIndexes.push({ "type": { "value": "local_sponsorships" } });
  }

  if (!!filters.ft_associated_to) {
    this.bob.query("bool", "should", [{
      'match': { 'local.associated_to': filters.ft_associated_to }
    }, {
      "type":
        { "value": "net_sponsorships" }
    }, {
      "type": { "value": "sponsorships" },
    },{
      "type": { "value": "local_sponsorships" },
    }]);

    queryIndexes.push({ "type": { "value": "net_sponsorships" } });
    queryIndexes.push({ "type": { "value": "sponsorships" } });
    queryIndexes.push({ "type": { "value": "local_sponsorships" } });
  }

  if (components.length > 0) {
    this.bob.query("bool", "should", components);
  }

  if (queryIndexes.length > 0) {
    this.bob.filter("bool", "should", queryIndexes);
  }

  return this;
}

module.exports = productQueryBuilder;
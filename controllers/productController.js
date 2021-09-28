const log = require('../helpers/log').logger;
const _ = require('lodash');
const bodybuilder = require('bodybuilder');
const es = require('../helpers/esOperation');
const config = require('config');
const util = require('../helpers/util');
// Controllers
const ProductQueryBuilder = require('../queries/products/productQueryBuilder.js');

const esConfig = config.get('elasticsearch');
const DEFAULT_RESULT_SIZE = 100;

/**
 *
 * @param req
 * @param q
 * @param filters
 * @param weekDayFmt
 * @param limit
 * @param offset
 * @param client
 */

const _buildSearchResponse = (result, weekDayFmt) => {
  log.debug('ProductController -> buildSearchResponse');

  return new Promise((resolve) => {
    resolve({
      data: util.formatSearchResult(result, weekDayFmt),
      length: result.hits.total
    });
  });
};

const _mapStateFilter = (filter, context) => {
  log.debug('ProductController -> mapStateFilter');

  if (_.isNil(filter)) {
    return [];
  }

  return context.exhibitors
    .filter(exhibitor => exhibitor.state === filter)
    .map(value => value.name);
};

const _filterResultPriceTable = (result, exhibitors) => {
  log.debug('ProductController -> filterResultPriceTable');

  return new Promise((resolve) => {
    _.forEach(result.hits.hits, (value) => {
      const filterValue = value;
      if (filterValue._source.priceTable !== undefined && filterValue._source.priceTable !== null) {
        filterValue._source.priceTable = _.filter(filterValue._source.priceTable, f =>
          _.includes(exhibitors, f.exhibitor)
        );
      }
    });

    resolve(result);
  });
};

const _filterResultQuotas = (result, exhibitors) => {
  log.debug('ProductController -> filterResultQuotas');

  return new Promise((resolve) => {
    _.forEach(result.hits.hits, (value) => {
      const filterValue = value;
      if (
        filterValue._source.siscom_data !== undefined &&
        filterValue._source.siscom_data !== null
      ) {
        filterValue._source.siscom_data.quotas = _.filter(
          filterValue._source.siscom_data.quotas,
          f => _.includes(exhibitors, f.location)
        );
      }
    });

    resolve(result);
  });
};

const _filterResultExhibitors = (result, exhibitors) => {
  log.debug('ProductController -> filterResultExhibitors');

  return new Promise((resolve) => {
    const _arrayExhibitors = exhibitors;
    _.forEach(result.hits.hits, (value) => {
      const filterValue = value;
      if (filterValue._source.local !== undefined && filterValue._source.local !== null) {
        filterValue._source.local.quotas = _.filter(filterValue._source.local.quotas, f =>
          _arrayExhibitors.some(cadaUmExhibitor => _.includes(cadaUmExhibitor, f.exhibitors))
        );
      }
    });
    resolve(result);
  });
};

const _filterResultLocalSponsorships = (result, exhibitors) => {
  log.debug('ProductController -> filterResultLocalSponsorships');

  return new Promise((resolve) => {
    const _arrayExhibitors = exhibitors;
    _.forEach(result.hits.hits, (value) => {
      const filterValue = value;
      if (
        filterValue._source.local_sponsorship !== undefined &&
        filterValue._source.local_sponsorship !== null
      ) {
        filterValue._source.local_sponsorship.exhibitors_info = _.filter(
          filterValue._source.local_sponsorship.exhibitors_info,
          f => _.includes(_arrayExhibitors, f.exhibitor)
        );
      }
    });
    resolve(result);
  });
};

const _mapRegionFilter = (filter, context) => {
  log.debug('ProductController -> mapRegionFilter');

  if (_.isNil(filter)) {
    return [];
  }
  const stateIds = context.states.filter(state => state.region === filter).map(state => state.id);

  return context.exhibitors
    .filter(exhibitor => stateIds.includes(exhibitor.state))
    .map(value => value.name);
};

const _mapExhibitorsGlobalContext = () => {
  log.debug('ProductController -> mapExhibitorsGlobalContext');

  const context = {};
  return new Promise((resolve, reject) => {
    util
      .constantListing('regions')
      .then((regions) => {
        context.regions = regions;
        return util.constantListing('states');
      })
      .then((states) => {
        context.states = states;
        return util.constantListing('exhibitors');
      })
      .then((exhibitors) => {
        context.exhibitors = exhibitors;
        resolve(context);
      })
      .catch(err => reject(err));
  });
};

const _search = ({
  // req,
  q,
  filters,
  week_day_fmt,
  limit = DEFAULT_RESULT_SIZE,
  offset = 0,
  client = 'app'
}) => {
  log.debug('ProductController -> search');

  let mappedExhibitors = [];
  let locationContext;

  const bob = bodybuilder();

  return _mapExhibitorsGlobalContext()
    .then((context) => {
      locationContext = context;
      if (filters.ft_exhibitor) mappedExhibitors = mappedExhibitors.concat(filters.ft_exhibitor);
      return _mapRegionFilter(filters.ft_region, locationContext);
    })
    .then((regionExhibitors) => {
      mappedExhibitors = mappedExhibitors.concat(regionExhibitors);
      return _mapStateFilter(filters.ft_state, locationContext);
    })
    .then(stateExhibitors => _.uniqBy(_.compact(mappedExhibitors.concat(stateExhibitors))))
    .then((exhibitors) => {
      new ProductQueryBuilder(bob)
        .queryExhibitors(filters, exhibitors)
        .queryProductType(filters)
        .queryProjectType(filters)
        .queryExhibitionInterval(filters)
        .queryMatchPhrase(q)
        .queryOwnership(filters)
        .queryAvailableSiscomQuota(filters)
        .sortResultBySource(client);

      return es
        .search({
          index: esConfig.index,
          body: bob
            .queryMinimumShouldMatch(1)
            .from(offset)
            .size(limit)
            .build()
        })
        .then((result) => {
          if (
            (filters.ft_exhibitor || filters.ft_state || filters.ft_region) &&
            filters.ft_available_quota
          ) {
            return _filterResultPriceTable(result, exhibitors)
              .then(data => _filterResultQuotas(data, exhibitors))
              .then(data => _filterResultExhibitors(data, exhibitors))
              .then(data => _filterResultLocalSponsorships(data, exhibitors))
              .then(data => _buildSearchResponse(data, week_day_fmt));
          }
          return _buildSearchResponse(result, week_day_fmt);
        })
        .catch(err => log.error(err));
    });
};

/**
 *
 * @param req
 * @param search_method
 * @param filters
 * @param q
 * @param week_day_fmt
 * @param limit
 * @param offset
 * @param client
 * @private
 */
const _searchByTerm = ({
  // req,
  // search_method,
  filters,
  q,
  week_day_fmt,
  limit = DEFAULT_RESULT_SIZE,
  offset = 0
  // client = 'app'
}) => {
  log.debug('ProductController -> searchByTerm');

  const _bob = bodybuilder();

  new ProductQueryBuilder(_bob)
    .queryMatchPhrase(q)
    .queryOwnership(filters)
    .queryPublished(true)
    .sortResultByAvailability();

  const queryIndexes = [
    { type: { value: 'projects' } },
    { type: { value: 'sponsorships' } },
    { type: { value: 'net_sponsorships' } },
    { type: { value: 'local_sponsorships' } }
  ];

  const query = _bob
    .queryMinimumShouldMatch(1)
    .filter('bool', 'should', queryIndexes)
    .from(offset)
    .size(limit)
    .build();

  return es
    .search({
      index: esConfig.index,
      body: query
    })
    .then(result => _buildSearchResponse(result, week_day_fmt));
};

/**
 *
 * @param filter
 * @returns {Promise}
 * @private
 */
/*
const _adaptExhibitorsIdsToNames = (filter) => {
  log.debug('ProductController -> adaptExhibitorsIdsToNames');

  return new Promise((resolve) => {
    if (!_.isNil(filter)) {
      return util.constantListing('exhibitors').then((base) => {
        resolve(_.map(_.filter(base, f => _.includes(filter, f.id)), m => m.name));
      });
    }
    resolve([]);
  });
};
*/

const _exhibitorConstant = () =>
  new Promise((resolve, reject) => {
    es
      .search({
        index: esConfig.index,
        type: 'exhibitors',
        body: {
          from: 0,
          size: 1000,
          query: {
            match_all: {}
          }
        }
      })
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        log.error(err);
        reject(err);
      });
  });

module.exports = {
  exhibitorConstant: _exhibitorConstant,
  search: _search,
  searchByTerm: _searchByTerm
};

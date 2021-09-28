const log = require('../helpers/log').logger;
const _ = require('lodash');
const httpHelper = require('../helpers/http');
const pagination = require('../helpers/pagination');
const productController = require('../controllers/productController');
const UserBusiness = require('./user');
const GroupBusiness = require('./group');
const SponsorshipBusiness = require('./sponsorships');
const ProjectBusiness = require('./projects');

function ProductBusiness(scope) {
  this.scope = scope;
  Object.assign(ProductBusiness.prototype, UserBusiness.prototype);
  Object.assign(ProductBusiness.prototype, GroupBusiness.prototype);
  Object.assign(ProductBusiness.prototype, SponsorshipBusiness.prototype);
  Object.assign(ProductBusiness.prototype, ProjectBusiness.prototype);
}

function _fixMultipleValueFilter(filter) {
  return _.map(_.split(filter, ','), filterValue => filterValue.trim());
}

function _exhibitorConversion(exhibitors) {
  return new Promise((resolve) => {
    productController.exhibitorConstant().then((result) => {
      const mapa = new Map();
      _.forEach(result.hits.hits, (item) => {
        mapa.set(item._id, item._source.name);
      });
      resolve(_.map(exhibitors, item => mapa.get(item)));
    });
  });
}

function _formatType(obj) {
  function replacer(key, value) {
    if (key === 'type') {
      if (typeof value === 'string') {
        const result = parseInt(value, 10);
        if (!isNaN(result)) {
          return parseInt(value, 10);
        }
      }
    }
    return value;
  }
  return JSON.stringify(obj, replacer);
}

ProductBusiness.prototype.checkProduct = function (req) {
  log.info('ProductBusiness -> checkProduct');

  return new Promise((resolve) => {
    const origem = _.isUndefined(req.query.client) || req.query.client !== 'cms' ? 'app' : 'cms';
    const formatWeekDay = !!req.query.week_day_fmt && req.query.week_day_fmt === 'string';

    // Filter mappings
    const filterOptions = {
      q: req.query.q,
      week_day_fmt: formatWeekDay,
      client: origem,
      limit: req.query.limit,
      offset: req.query.offset
    };
    filterOptions.filters = _.pickBy(req.query, (v, k) => _.startsWith(k, 'ft_'));

    // TODO Revalidar campos passados via querystring e nao via body post
    filterOptions.search_method = req.query.search_method || 'match';
    _.assign(filterOptions.filters, { userDetails: this.scope.user });
    _.assign(filterOptions.filters, { groupDetails: this.scope.group });

    filterOptions.filters.ft_product_type =
      filterOptions.filters.ft_product_type || 'sponsorship,project';
    filterOptions.filters.ft_product_range =
      filterOptions.filters.ft_product_range || 'local,national,digital_media';

    if (filterOptions.filters.ft_product_range) {
      filterOptions.filters.ft_product_range = _fixMultipleValueFilter(
        filterOptions.filters.ft_product_range
      );
    }

    if (filterOptions.filters.ft_product_type) {
      filterOptions.filters.ft_product_type = _fixMultipleValueFilter(
        filterOptions.filters.ft_product_type
      );
    }

    if (filterOptions.filters.ft_exhibitor) {
      _exhibitorConversion(_fixMultipleValueFilter(filterOptions.filters.ft_exhibitor)).then(
        (result) => {
          filterOptions.filters.ft_exhibitor = result;
        }
      );
    }

    this.scope.filterOptions = filterOptions;
    resolve(this.scope);
  });
};

ProductBusiness.prototype.checkTermProduct = function (req) {
  log.info('ProductBusiness -> checkTermProduct');

  return new Promise((resolve) => {
    const origem = _.isUndefined(req.query.client) || req.query.client !== 'cms' ? 'app' : 'cms';
    const filterOptions = {
      q: req.query.q,
      week_day_fmt: true,
      client: origem,
      limit: req.query.limit,
      offset: req.query.offset
    };

    filterOptions.filters = _.pickBy(req.query, (v, k) => _.startsWith(k, 'ft_'));
    filterOptions.filters.userDetails = this.scope.user;
    filterOptions.filters.groupDetails = this.scope.group;

    this.scope.filterOptions = filterOptions;
    resolve(this.scope);
  });
};

ProductBusiness.prototype.enviarRespostaProduto = function (res, status, msg) {
  log.info('ProductBusiness -> enviarResposta');
  return new Promise((resolve) => {
    res.status(status).json(JSON.parse(_formatType(msg)));
    resolve(this.scope);
  });
};

ProductBusiness.prototype.enviarResposta = function (res, status, msg) {
  log.info('ProductBusiness -> enviarResposta');

  return new Promise((resolve) => {
    res.status(status).json(msg);
    resolve(this.scope);
  });
};

ProductBusiness.prototype.searchProduct = function (req) {
  log.info('ProductBusiness -> searchProduct');

  return new Promise((resolve, reject) => {
    productController
      .search(this.scope.filterOptions)
      .then((queryResult) => {
        this.scope.resultSearchProduct = pagination({
          data: queryResult.data,
          length: queryResult.length,
          limit: req.query.limit,
          page: req.query.page,
          offset: req.query.offset
        });
        resolve(this.scope);
      })
      .catch(err => reject({ type: 'searchProduct', err }));
  });
};

ProductBusiness.prototype.searchByTerm = function (req) {
  log.info('ProductBusiness -> searchByTerm');

  return new Promise((resolve, reject) => {
    productController
      .searchByTerm(this.scope.filterOptions)
      .then((queryResult) => {
        this.scope.resultSearchByTermProduct = pagination({
          data: queryResult.data,
          length: queryResult.length,
          limit: req.query.limit,
          page: req.query.page,
          offset: req.query.offset
        });
        resolve(this.scope);
      })
      .catch(err => reject({ type: 'searchByTerm', err }));
  });
};

ProductBusiness.prototype.errorHandler = function (err, res) {
  log.error(err);
  switch (err.type) {
    case 'addAttachmentNotFound':
      httpHelper.notFoundResponse(res);
      break;
    case 'getGroupNotFound':
      httpHelper.notFoundResponse(res);
      break;
    case 'getProjectNotFound':
      httpHelper.notFoundResponse(res);
      break;
    case 'verificaPermissaoLeitura':
      httpHelper.forbiddenResponse(res);
      break;
    case 'checkUser':
      httpHelper.forbiddenResponse(res);
      break;
    case 'validaHolder':
      httpHelper.forbiddenResponse(res);
      break;
    default:
      httpHelper.errorResponse(res);
  }
};

module.exports = ProductBusiness;

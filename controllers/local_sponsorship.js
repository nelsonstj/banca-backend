const bodybuilder = require('bodybuilder');
const _ = require('lodash');
const moment = require('moment');
const config = require('config');
const inspect = require('eyes').inspector({ maxLength: 200000 });
const es = require('../helpers/esOperation');
const integracao = require('../helpers/integration');
const util = require('../helpers/util');

const esConfig = config.get('elasticsearch');
const PROJECTS_TYPE = 'local_sponsorships';
const DEFAULT_RESULT_SIZE = 2000;

const _search = ({ search_method, q, filters, week_day_fmt, offset = 0, client = 'app' }) => {
    let bob = bodybuilder();
    if (q) {
        bob = bob.query('match_phrase_prefix', { _all: q }).orQuery('fuzzy', '_all', `*${q}*`);
    }

    const context = {};
    context.date = {};
    context.date.start = filters.ft_exhibition_start_gte;
    context.date.end = filters.ft_exhibition_end_lte;
    const dateFilter = {};

    if (filters.ft_start_date) {
        dateFilter.gte = moment.utc(filters.ft_start_date, moment.ISO_8601).format('YYYY-MM-DD');
    } else {
        filters.ft_start_date = moment(new Date()).utc().format('YYYY-MM-DD');
        dateFilter.gte = moment(new Date()).utc().format('YYYY-MM-DD');
    }

    if (filters.ft_end_date) {
        dateFilter.lte = moment.utc(filters.ft_end_date, moment.ISO_8601).format('YYYY-MM-DD');
    } else {
        dateFilter.lte = null;
    }

    dateFilter.format = 'yyyy-MM-dd';
    bob = bob.query('bool', {
        should: [{
            range: {
                priorityDate: {
                    gte: dateFilter.gte,
                    lte: dateFilter.lte,
                    format: 'yyyy-MM-dd'
                }
            }
        },
        {
            bool: {
                must_not: {
                    exists: { field: 'priorityDate' }
                }
            }
        }]
    });

    return util.constantListing('regions').then((regions) => {
      context.regions = regions;
      return util.constantListing('states');
    }).then((states) => {
      context.states = states;
      return util.constantListing('exhibitors');
    }).then((exhibitors) => {
      context.exhibitors = exhibitors;

      bob = _.reduce(filters, (_bob, filterValue, filterKey) => {
        if (_bob === null || typeof _bob === 'undefined') {
          _bob = bob;
        }

        if (_.includes(_.keys(this.filterMapping), filterKey)) {
          return this.filterMapping[filterKey](context)(_bob, filterValue);
        }
        return bob;
      }, bob);
      return bob;
    }).then(() => {
      bob.orFilter('match', 'owner', filters.userDetails.group);
      bob.orFilter('match', 'holder', filters.userDetails.group);

      if (client === 'cms') {
        bob = bob.sort('updated_at', 'desc');
      } else {
        bob.sort('siscom_data.purchaseStatus');
        bob.sort('priorityDate');
        bob.sort('main_type');
      }

      bob.filterMinimumShouldMatch(1);

      return es.search({
        index: esConfig.index,
        type: PROJECTS_TYPE,
        body: bob.queryMinimumShouldMatch(1).from(offset).size(DEFAULT_RESULT_SIZE).build()
      }).then((result) => { util.formatSearchResult(result, week_day_fmt); });
    });
};

const isData = () => {
    let bob = bodybuilder();
    bob = bob.query('match_all');
    return es.search({
      index: esConfig.index,
      type: PROJECTS_TYPE,
      body: bob.build()
    }).then(result => {
        return result
    });
};

const _deleteData = () => {
    client.deleteByQuery({
       index: esConfig.index,
       type: PROJECTS_TYPE,
        body: {
            query: {
                match_all: {}
            }
        }
    }, function (error) {
        return !!error
    });
};

const _updateData = (oldData, newData) => {
    newData.forEach((valor_old) => {
        oldData.forEach((valor_new) => {
            let new_program_initials = valor_new.local_sponsorship.program_initials;
            let old_program_initials = valor_old.local_sponsorship.program_initials;
            if (old_program_initials === new_program_initials) {
                let _new_exhibitors_info = valor_new.local_sponsorship.exhibitors_info;
                let _old_exhibitors_info = valor_old.local_sponsorship.exhibitors_info;
                _old_exhibitors_info.forEach((valor_exhibitor_old) => {
                    _new_exhibitors_info.forEach((valor_exhibitor_new) => {
                        if (valor_exhibitor_old.exhibitor === valor_exhibitor_new.exhibitor) {
                            let price_update = false;
                            valor_exhibitor_new.prices.forEach((cada_valor_exhibitor_new) => {
                                valor_exhibitor_old.prices.forEach((elemento_old)=>{
                                    inspect(elemento_old,'elemento_old');
                                    inspect(cada_valor_exhibitor_new,'cada_valor_exhibitor_new');
                                    // Se as datas coincidem
                                    if (elemento_old.referenceDate === cada_valor_exhibitor_new.referenceDate){
                                        price_update = true;
                                        inspect('entrou na igualdade de referenceDate');
                                        if (_.has(cada_valor_exhibitor_new,'monthlyPrice')){
                                            elemento_old.monthlyPrice = cada_valor_exhibitor_new.monthlyPrice;
                                        }
                                        if (_.has(cada_valor_exhibitor_new,'digitalPrice')){
                                            elemento_old.digitalPrice = cada_valor_exhibitor_new.digitalPrice;
                                        }       
                                    } 
                               });
                               if (!price_update) { 
                                    valor_exhibitor_old.prices.push(cada_valor_exhibitor_new);
                                    price_update = false;
                                }
                            })
                        }
                    })
                })
            }
        });
    });
    return newData;
};

const _create = ({ main_type, data }) => {
  const projectData = _.assign(data, {
    attachments: [],
  });

  return projectData.map((cadaPrograma) => {
    return es.index({
      index: esConfig.index,
      type: PROJECTS_TYPE,
      body: cadaPrograma
    }).then(result => { id: result._id });
  });
};


const _get = ({ id }) => {
  return es.get({
    index: esConfig.index,
    type: PROJECTS_TYPE,
    id,
  }).then(result => _.assign(result._source, {
    id: result._id
  }));
};


const _bulk = (body) => {
  return es.bulk(body);
};

//
// let _getMonth = ({idMonth}) => {
//     let bob = bodybuilder();
//     bob = bob.query('match', 'referenceMonth', idMonth.toString());
//     return es.search({
//         index: esConfig.index,
//         type: PROJECTS_TYPE,
//         body: bob.build()
//     }).then(result => {
//         return result;
//     });
// };


const _getAll = () => {
  let bob = bodybuilder();
  bob = bob.query('match_all');
  return es.search({
    index: esConfig.index,
    type: PROJECTS_TYPE,
    body: bob.build()
  }).then((result) => {
    return result;
  });
};


// let _update = ({id, data}) => {
//
//     let _id = id;
//
//     const projectData = _.assign(data, {
//         updated_at: new Date(),
//     });
//
//     PROJECT_RANGES.forEach((range) => {
//         const exhibition = _.get(projectData, `${range}.exhibition`);
//
//         if (exhibition) {
//             projectData[range].exhibition = this.addExhibitionEnd(exhibition);
//         }
//     });
//
//     projectData.priorityDate = this.calculatePriorityDate(projectData);
//
//     return this.associateSiscomData(projectData).then(() => es.update({
//         index: esConfig.index,
//         type: PROJECTS_TYPE,
//         id: _id,
//         body: {doc: projectData}
//     })).then(result => ({
//         id: result._id
//     }));
// };

const _enviarBarramento = (local_sponsorship) => {
  return integracao.enviar(local_sponsorship);
};
  
module.exports = {
  search: _search,
  create: _create,
  isData: isData,
  deleteData: _deleteData,
  updateData: _updateData,
  get: _get,
  getAll: _getAll,
  bulk: _bulk,
  enviarBarramento: _enviarBarramento
};

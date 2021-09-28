const _ = require('lodash');
const config = require('config');
const es = require('./elastic').client;
// const inspect = require('eyes').inspector({ maxLength: 200000 });

const _displayWeekDay = conf => day => conf[day];
const _weekDayFormat = programDays => programDays.map(_displayWeekDay(config.get('week_days')));

const _formatProgramDays = (project, formatWeekDay) => {
  const result = _.cloneDeep(project);

  if (formatWeekDay) {
    ['national_sponsorship', 'local', 'digital_media', 'national', 'net_sponsorship'].forEach(
      (range) => {
        const programDays = _.get(project, `${range}.program_days`);
        if (programDays) {
          result[range].program_days = _weekDayFormat(programDays);
        }
      }
    );
  }
  return result;
};

const _formatSearchResult = (result, formatWeekDay) =>
  result.hits.hits.map((hit) => {
    const _result = hit._source;
    _result.id = hit._id;
    return _formatProgramDays(_result, formatWeekDay);
  });

const _constantListing = constantType =>
  new Promise((resolve, reject) => {
    es
      .search({
        index: config.get('elasticsearch.index'),
        type: constantType,
        body: {
          from: 0,
          size: 500,
          query: {
            match_all: {}
          }
        }
      })
      .then((result) => {
        resolve(_formatSearchResult(result));
      })
      .catch((err) => {
        reject(err);
      });
  });

const _createConstants = (constantType, values) =>
  es.bulk({
    body: _.flatten(
      _.map(values, (value, i) => [
        {
          index: {
            _index: config.get('elasticsearch'),
            _id: i + 1,
            _type: constantType
          }
        },
        value
      ])
    )
  });

module.exports = {
  displayWeekDay: _displayWeekDay,
  weekDayFormat: _weekDayFormat,
  formatProgramDays: _formatProgramDays,
  formatSearchResult: _formatSearchResult,
  constantListing: _constantListing,
  createConstants: _createConstants
};

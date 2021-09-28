const _ = require('lodash');

module.exports = ({ data, length, limit = 0, pagina = 1, offset = 0 }) => {
  let _limit = limit === 0 ? data.length : limit;
  let _paginationObject = {
    total_results: length,
    results: parseInt(_limit, 10),
    first_result: parseInt(offset, 10),
    last_result: length < (parseInt(offset, 10) + parseInt(_limit, 10)) ? length : (parseInt(offset, 10) + parseInt(_limit, 10))
  };
  return _.assign({ pagination_info: _paginationObject }, { result: data })
};

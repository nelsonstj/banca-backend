const service = require('./dumpSiscomPlans.js');

service.handler(
  {
    esHostname: 'https://search-bancadev-???',
    page: 1,
    pageSize: 200
  },
  null,
  (err, data) => {
    if (err) {
      console.log('Erro: ', err);
    } else {
      console.log('Deu certo!', data);
    }
  }
);
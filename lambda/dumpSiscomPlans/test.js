const service = require('./dumpSiscomPlans.js');

service.handler(
  {
    esHostname: 'https://search-bancadev-???.us-east-1.es.amazonaws.com/',
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
const func = require('./dumpPriceTable');

func.handler(
  {
    startDate: new Date(2017, 9, 1),
    duration: 7,
    esHost: 'https://search-???',
    ec2Host: 'https://???',
    endpoint: 'ComercialApps.Apresentacao/api/v1/pricetable',
    accessToken: '???'
  },
  null,
  (err, res) => {
    if (err) {
      console.log('error:', err);
    } else {
      console.log('done!', res);
    }
  }
);

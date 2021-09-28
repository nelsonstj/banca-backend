const client = require('./enrichSponsorshipData.js');

client.handler(null, null, (err, data) => {
  if (err) {
    console.log(err);
  }
  else {
    console.log(data);
  }
});
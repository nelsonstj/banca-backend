const client = require('./enrichLocalSponsorshipData.js');

client.handler(null, null, (err, data) => {
  if (err) {
    console.log(err);
  }
  else {
    console.log(data);
  }
});

const login = require('./login');
const got = require('got');

const HOST = 'http://localhost:2000';


(function() {
  if (!login.check_auth()) {
    return login.get_auth()
  }
  return Promise.resolve()
})()
  .then(() => login.load_auth())
  .then(authorization => {
    return got.post(`${HOST}/api/v1/projects?main_type=local&extra_type=digital_media`,{
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      },
      json: true,
      body: JSON.stringify(require('./insert_local_project.json'))
    }).then(res => {
      console.log('Got response...');
      console.log(res.statusCode, res.statusMessage);
      console.dir(res.body);
    })
  })
  .catch(err => {
    console.log(require('util').inspect(err, { depth: null }));
    console.error(err.response.body);
  })

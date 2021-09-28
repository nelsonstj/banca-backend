const login = require('./login');
const got = require('got');

const HOST = 'http://localhost:2000';
const project_id = process.argv[2];
console.log(project_id);

(function() {
  if (!login.check_auth()) {
    return login.get_auth()
  }
  return Promise.resolve()
})()
  .then(() => login.load_auth())
  .then(authorization => {
    return got.get(`${HOST}/api/v1/projects/${project_id}`,{
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      },
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

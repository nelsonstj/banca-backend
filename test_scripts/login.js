const got = require('got');
const inquirer = require('inquirer');
const fs = require('fs');
const bluebird = require('bluebird');


const HOST = 'http://localhost:2000'
// const HOST = 'http://54.166.228.250';



const AUTHORIZATION_PATH = `${__dirname}/.authorization`;
const CREDENTIALS_PATH = `${__dirname}/.credentials.json`

function get_credentials() {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    return Promise.resolve(require(CREDENTIALS_PATH))
  } else {
    return inquirer.prompt([{
        type: 'input',
        message: 'username',
        name: 'username'
      },
      {
        type: 'password',
        message: 'password',
        name: 'password'
      },
    ])
  }

}



function login(credentials) {
  got(`${HOST}/api/v1/login`, {
      method: 'POST',
      json: true,
      form: false,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    })
    .then(response => {
      fs.writeFile(AUTHORIZATION_PATH, response.headers['authorization'])
    })
}

function get_auth() {
  return get_credentials().then(login)
}

function check_auth() {
    return fs.existsSync(AUTHORIZATION_PATH)
}

function load_auth() {
  return bluebird.promisify(fs.readFile)(AUTHORIZATION_PATH)
}


module.exports.get_auth = get_auth;
module.exports.check_auth = check_auth;
module.exports.load_auth = load_auth;

const got = require('got');
const Promise = require('bluebird');
const crypto = require('crypto');
const parseXML = Promise.promisify(require('xml2js').parseString);
const log = require('winston');


const iv = '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'; // 16 bytes


class SisComClient {
  constructor(baseUrl, encryptionKey, encryptionAlgorithm, passwordLength) {
    this.baseUrl = baseUrl;
    log.debug('Siscom URL', this.baseUrl);
    this.encryptionKey = encryptionKey;
    this.encryptionAlgorithm = encryptionAlgorithm;
    this.passwordLength = passwordLength;
  }

  encrypt(text) {
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);
    let crypted = cipher.update(text, 'utf8', 'base64');
    crypted += cipher.final('base64');
    return crypted;
  }

  login(username, password) {
    return got(`${this.baseUrl}/webservice_siscom_mobile/ws_siscom_mobile.asmx/AutenticaUsuario`,
      {
        ciphers: 'DES-CBC3-SHA',
        method: 'POST',
        rejectUnauthorized: false,
        body: {
          usuario: this.encrypt(username),
          senha: this.encrypt(password.substring(0, this.passwordLength)) },
      }).then((response) => {
        log.debug(response.body);
        return parseXML(response.body);
      })
        .catch(error => Promise.reject({ code: 500, error }))
        .then((authData) => {
          if (authData.AUTENTICACAO.SUCESSO[0] === '1') {
            return Promise.resolve(username);
          }
          return Promise.reject({ code: 401, error: 'Unauthorized' });
        });
  }

}

exports.SisComClient = SisComClient;

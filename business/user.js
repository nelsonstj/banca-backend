const log = require('../helpers/log').logger;
const httpHelper = require('../helpers/http');

const userController = require('../controllers/user');

function UserBusiness(scope) {
  this.scope = scope;
}

UserBusiness.prototype.getUser = function (req) {
  log.info('UserBusiness -> getUser');
  return new Promise((resolve, reject) => {
    userController.get({ username: req.user.username })
    .then((user) => {
      this.scope.user = user;
      resolve(this.scope);
    })
    .catch((err) => reject({ type: "getUser", err: err }))
  });
};

UserBusiness.prototype.checkUser = function () {
  log.info('UserBusiness -> checkUser');
  return new Promise((resolve, reject) => {
    if (!this.scope.user.group) {
      log.info('user has no group');
      reject({ type: "checkUser" });
    } else {
      resolve(this.scope);
    }
  });
};

UserBusiness.prototype.userGetByGroup = function (req) {
  log.info('UserBusiness -> userGetByGroup');
  return new Promise((resolve, reject) => {
    if (this.scope.holder_changed === true) {
      userController.getByGroup({ groupId: req._body.holder })
      .then((userGroup) => {
        this.scope.userGroup = userGroup;
        resolve(this.scope);
      })
      .catch((err) => reject({ type: "userGetByGroup", err: err }));
    } else {
      resolve(this.scope);
    }
  });
};

UserBusiness.prototype.getUserCrm = function (reqEmail) {
  log.info('UserBusiness -> getUserCrm');
  return new Promise((resolve, reject) => {
    userController.getUserCrm(reqEmail) // ('go.servicos.integracao@tvglobo.com.br')
    .then((result) => {
      this.scope.usercrm = result;
      resolve(this.scope);
    })
    .catch((err) => { reject({ type: 'getUserCrm', err: err }); });
  });
};

UserBusiness.prototype.getUserCrmRoles = function (reqEmail) {
  log.info('UserBusiness -> getUserCrmRoles');
  return new Promise((resolve, reject) => {
    userController.getUserCrm(reqEmail)
    .then((result) => {
      this.scope.usercrm = result;
      userController.getUserCrmRoles({ usercrm: this.scope.usercrm })
      .then((result2) => {
        if (JSON.stringify(result2) === '[]') {
          reject({ type: 'getUserCrmRoles', err: err });
        }
        this.scope.roles = { message: "Usuário tem permissão para criar ofertas no GO! CRM" };
        resolve(this.scope);
      })
      .catch((err) => { reject({ type: 'getUserCrmRoles', err: err }); });
    })
    .catch((err) => { reject({ type: 'getUserCrm', err: err }); });
  });
};

UserBusiness.prototype.errorHandler = (err, res) => {
  log.error(err);
  switch (err.type) {
    case 'getUserCrm':
      httpHelper.unauthorizedResponse(res, "Usuário não está cadastrado no GO! CRM");
      break;
    case 'getUserCrmRoles':
      httpHelper.unauthorizedResponse(res, "Usuário não tem permissão para criar ofertas no GO! CRM");
      break;
    default:
      httpHelper.errorResponse(res);
  }
};
  
UserBusiness.prototype.enviarResposta = (res, status, msg) => {
  log.info('UserBusiness -> enviarResposta');
  return new Promise((resolve) => {
    res.status(status).json(msg);
    resolve(this.scope);
  });
};

module.exports = UserBusiness;

const router = require('express').Router();
const log = require('../helpers/log').logger;
const requireUser = require('../middlewares/requireUser');
const AccountBusiness = require('../business/account');

router.use(requireUser);

router.get('/all', (req, res) => {
    log.info('AccountRouter -> all');
    let accountBusiness = new AccountBusiness({});
    accountBusiness.getAllAccounts()
        .then(scope => accountBusiness.enviarResposta(res, 200, scope.allaccounts))
        .catch(err  => accountBusiness.errorHandler(err, res));
});

router.get('/prospects', (req, res) => {
    log.info('AccountRouter -> all');
    let accountBusiness = new AccountBusiness({});
    accountBusiness.getAllProspects()
        .then(scope => accountBusiness.enviarResposta(res, 200, scope.prospects))
        .catch(err  => accountBusiness.errorHandler(err, res));
});

router.get('/my', (req, res) => {
    log.info('AccountRouter -> my');
    let accountBusiness = new AccountBusiness({});
    accountBusiness.getUser(req)
        .then(scope => accountBusiness.getUserCrm(req.user.email))
        .then(scope => accountBusiness.getMyAccounts(req))
        .then(scope => accountBusiness.enviarResposta(res, 200, scope.myaccounts))
        .catch(err  => accountBusiness.errorHandler(err, res));
});

router.get('/personal', (req, res) => {
    log.info('AccountRouter -> personal');
    let accountBusiness = new AccountBusiness({});
    accountBusiness.getUser(req)
        .then(scope => accountBusiness.getUserCrm(req.user.email))
        .then(scope => accountBusiness.getMyAccounts(req))
        .then(scope => accountBusiness.getAllProspects())
        .then(scope => accountBusiness.getAllAccounts())
        .then(scope => accountBusiness.getPersAccounts())
        .then(scope => accountBusiness.enviarResposta(res, 200, scope.accounts))
        .catch(err  => accountBusiness.errorHandler(err, res));
});

router.get('/search', (req, res) => {
    log.info('AccountRouter -> search -> req:' + req);
    let accountBusiness = new AccountBusiness({});
    accountBusiness.getAccountsByName(req)
        .then(scope => accountBusiness.enviarResposta(res, 200, scope.accounts))
        .catch(err  => accountBusiness.errorHandler(err, res));
});

router.get('/:id', (req, res) => {
    log.info('AccountRouter -> get(id) -> req: ' + req);
    let accountBusiness = new AccountBusiness({});
    accountBusiness.getAccountById(req)
        .then(scope => accountBusiness.enviarResposta(res, 200, scope.accounts))
        .catch(err  => accountBusiness.errorHandler(err, res));
});

router.get('', (req, res) => {
    log.info('AccountRouter -> all -> req:' + req);
    let accountBusiness = new AccountBusiness({});
    accountBusiness.getAllAccounts()
        .then(scope => accountBusiness.enviarResposta(res, 200, scope.allaccounts))
        .catch(err  => accountBusiness.errorHandler(err, res));
});

module.exports = router;

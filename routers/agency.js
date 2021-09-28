const router = require('express').Router();
const log = require('../helpers/log').logger;
const requireUser = require('../middlewares/requireUser');
const AgencyBusiness = require('../business/agency');

router.use(requireUser);

router.get('/all', (req, res) => {
    log.info('AgencyRouter -> /all');
    let agencyBusiness = new AgencyBusiness({});
    agencyBusiness.getAllAgencies()
        .then(scope => agencyBusiness.enviarResposta(res, 200, scope.agencies))
        .catch(err  => agencyBusiness.errorHandler(err, res));
});

router.get('/search', (req, res) => {
    log.info('AgencyRouter -> /search');
    let agencyBusiness = new AgencyBusiness({});
    agencyBusiness.getAgencyByName(req)
        .then(scope => agencyBusiness.enviarResposta(res, 200, scope.agencies))
        .catch(err  => agencyBusiness.errorHandler(err, res));
});

router.get('/:accountid', (req, res) => {
    log.info('AgencyRouter -> get(:accountid) -> req:' + JSON.stringify(req.params));
    let agencyBusiness = new AgencyBusiness({});
    agencyBusiness.getAgenciesByAccountId(req)
        .then(scope => agencyBusiness.getAgenciesInAccount())
        .then(scope => agencyBusiness.enviarResposta(res, 200, scope.agencies))
        .catch(err  => agencyBusiness.errorHandler(err, res));
});

router.get('/:id', (req, res) => {
    log.info('AgencyRouter -> get(:id)');
    let agencyBusiness = new AgencyBusiness({});
    agencyBusiness.getAgencyById(req)
        .then(scope => agencyBusiness.enviarResposta(res, 200, scope.agencies))
        .catch(err  => agencyBusiness.errorHandler(err, res));
});

router.get('', (req, res) => {
    log.info('AgencyRouter -> get()');
    let agencyBusiness = new AgencyBusiness({});
    agencyBusiness.getAllAgencies()
        .then(scope => agencyBusiness.enviarResposta(res, 200, scope.agencies))
        .catch(err  => agencyBusiness.errorHandler(err, res));
});

module.exports = router;

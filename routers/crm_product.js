const router = require('express').Router();
const log = require('../helpers/log').logger;
const requireUser = require('../middlewares/requireUser');
const CrmProductBusiness = require('../business/crmProduct');

router.use(requireUser);

router.get('/all', (req, res) => {
    log.info('CrmProductRouter -> /all');
    let crmProductBusiness = new CrmProductBusiness({});
    crmProductBusiness.getAllProducts()
        .then(scope => crmProductBusiness.enviarResposta(res, 200, scope.products))
        .catch(err  => crmProductBusiness.errorHandler(err, res));
});

router.get('/search', (req, res) => {
    log.info('CrmProductRouter -> /search');
    let crmProductBusiness = new CrmProductBusiness({});
    crmProductBusiness.getProductByName(req)
        .then(scope => crmProductBusiness.enviarResposta(res, 200, scope.products))
        .catch(err  => crmProductBusiness.errorHandler(err, res));
});

router.get('/:id', (req, res) => {
    log.info('CrmProductRouter -> get(:id)');
    let crmProductBusiness = new CrmProductBusiness({});
    crmProductBusiness.getProductById(req)
        .then(scope => crmProductBusiness.enviarResposta(res, 200, scope.product))
        .catch(err  => crmProductBusiness.errorHandler(err, res));
});

router.get('', (req, res) => {
    log.info('CrmProductRouter -> get');
    let crmProductBusiness = new CrmProductBusiness({});
    crmProductBusiness.getAllProducts()
        .then(scope => crmProductBusiness.enviarResposta(res, 200, scope.products))
        .catch(err  => crmProductBusiness.errorHandler(err, res));
});

module.exports = router;

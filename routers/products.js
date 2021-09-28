const validate = require('../middlewares/validate');
const requireUser = require('../middlewares/requireUser');
const schemas = require('../schemas/products');
const _ = require('lodash');
const router = require('express').Router();

//Business
const ProductBusiness = require('../business/products');

router.use(requireUser);

router.get('/search_v2', validate({ query: schemas.productSearchQuerySchema }), (req, res) => {
    let productBusiness = new ProductBusiness({});
    productBusiness.getUser(req)
        .then((scope) => productBusiness.getSearchGroup())
        .then((scope) => productBusiness.checkProduct(req))
        .then((scope) => productBusiness.searchProduct(req))
        .then((scope) => productBusiness.enviarRespostaProduto(res, 200, scope.resultSearchProduct))
        .catch((err) => productBusiness.errorHandler(err, res));
});

router.get('/search_by_term', validate({ query: schemas.productSearchQuerySchema }), (req, res) => {
    let productBusiness = new ProductBusiness({});
    productBusiness.getUser(req)
        .then((scope) => productBusiness.getSearchGroup())
        .then((scope) => productBusiness.checkTermProduct(req))
        .then((scope) => productBusiness.searchByTerm(req))
        .then((scope) => productBusiness.enviarRespostaProduto(res, 200, scope.resultSearchByTermProduct))
        .catch((err) => productBusiness.errorHandler(err, res));
});

router.get('/recents', (req, res) => {
    let productBusiness = new ProductBusiness({});
    productBusiness.getUser(req)
        .then((scope) => productBusiness.validateSponsorshipType(req))
        .then((scope) => productBusiness.validateProjectType(req))
        .then((scope) => productBusiness.queryRecentProjects(req))
        .then((scope) => productBusiness.queryRecentSponsorships(req))
        .then((scope) => productBusiness.enviarResposta(res, 200, _.flatten([scope.resultQueryRecentProjects, scope.resultQueryRecentSponsorships])))
        .catch((err) => productBusiness.errorHandler(err, res));
});


module.exports = router;

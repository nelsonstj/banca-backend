const router = require('express').Router();
const log = require('../helpers/log').logger;
const requireUser = require('../middlewares/requireUser');
const CrmEntityBusiness = require('../business/crmEntity');

router.use(requireUser);

router.get('/:entity', (req, res) => {
    log.info('EntityRouter -> get(:entity)');
    let crmEntityBusiness = new CrmEntityBusiness({});
    crmEntityBusiness.getAllEntity(req)
        .then(scope => crmEntityBusiness.enviarResposta(res, 200, scope.entity))
        .catch(err  => crmEntityBusiness.errorHandler(err, res));
});

module.exports = router;

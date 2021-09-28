const router = require('express').Router();
const requireUser = require('../middlewares/requireUser');
const log = require('../helpers/log').logger;

// Business
const IntegrationBusiness = require('../business/integration');

router.use(requireUser);

router.post('/carga', (req, res) => {
  log.info('Integration Router -> carga');
  const integrationBusiness = new IntegrationBusiness();
  integrationBusiness.integracaoEnviar(req.body) // Integração com CRM Dynamics
    .then((scope) => { integrationBusiness.enviarResposta(res, 201, scope) })
    .catch((err) => { integrationBusiness.errorHandler(err, res); });
});

module.exports = router;

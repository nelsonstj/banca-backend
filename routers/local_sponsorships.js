const multer = require('multer');
const router = require('express').Router();
const requireUser = require('../middlewares/requireUser');
const log = require("../helpers/log").logger;

const upload = multer({ dest: 'uploads/' });

// Business
const LocalSponsorshipBusiness = require('../business/local_sponsorships');

router.use(requireUser);

router.post('/upload', upload.single('attachment'), (req, res) => {
  log.info("Local_sponsorships Router -> upload");
  const localSponsorshipBusiness = new LocalSponsorshipBusiness({ mapa: new Map() });
  localSponsorshipBusiness.zipReader(req)
    .then(() => { localSponsorshipBusiness.excelDirTransversing(); })
    .then(() => { localSponsorshipBusiness.handlerExcelFile(req); })
    .then(() => { localSponsorshipBusiness.mergeData(); })
    .then(() => { localSponsorshipBusiness.getAllLocalSponsorship(); })
    .then(() => { localSponsorshipBusiness.siscomData(); })
    .then(() => { localSponsorshipBusiness.preparaBulk(); })
    .then(() => { localSponsorshipBusiness.executaBulk(); })
    .then(() => { localSponsorshipBusiness.integracaoEnviar(); }) // Integração com CRM Dynamics
    .then((scope) => { localSponsorshipBusiness.enviarResposta(res, 201, { bulkBody: scope.bulkResponseResult, xlsParser: scope.mapa }); })
    .catch((err) => { localSponsorshipBusiness.errorHandler(err, res); });
});

router.get('/:id', (req, res) => {
  log.info("Local_sponsorships Router -> get/:id");
  const localSponsorshipBusiness = new LocalSponsorshipBusiness({});
  localSponsorshipBusiness.getUser(req)
    .then(() => { localSponsorshipBusiness.getGroup(); })
    .then(() => { localSponsorshipBusiness.getLocalSponsorship(req); })
    .then((scope) => { localSponsorshipBusiness.enviarResposta(res, 200, scope.getLocalSponsorshipResult); })
    .catch((err) => { localSponsorshipBusiness.errorHandler(err, res); });
});

router.get('', (req, res) => {
  log.info("Local_sponsorships Router -> get");
  const localSponsorshipBusiness = new LocalSponsorshipBusiness({});
  localSponsorshipBusiness.getUser(req)
    .then(() => { localSponsorshipBusiness.getGroup(); })
    .then(() => { localSponsorshipBusiness.getAllLocalSponsorship(); })
    .then((scope) => { localSponsorshipBusiness.enviarResposta(res, 200, scope.getAllLocalSponsorshipResult); })
    .catch((err) => { localSponsorshipBusiness.errorHandler(err, res); });
});

module.exports = router;

const router = require('express').Router();

const requireUser = require('../middlewares/requireUser');
const conversionIndexController = require('../controllers/conversionIndexController');

router.use(requireUser);



// TODO REFATORAR
router.get('/:acronym', (req, res) => {
  if (req.params.acronym === null || typeof req.params.acronym === "undefined") {
    return res.status(400);
  }

  conversionIndexController.get(req.params.acronym).then(data => {
    // Não podemos ter mais de um valor por sigla!
    if (data.length > 1) {
      return res.status(404).end();
    }

    if (data.length === 1) {
      const parsedData = data.map((value) => {
        return {
          "conversionIndex": value.indice
        }
      });

      return res.json(parsedData[0]);
    }
    else {
      return res.json({ "conversionIndex": 1 });
    }

  }).catch(err => res.status(500).end());
});

module.exports = router;
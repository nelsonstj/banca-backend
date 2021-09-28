const router = require('express').Router();
const priceTableController = require("../controllers/SiscomPriceTableController");
const requireUser = require('../middlewares/requireUser');

router.use(requireUser);

router.get('/:acronym/:competence', (req, res) => {
    if (req.params.acronym === null || typeof req.params.acronym === "undefined") {
        return res.status(400);
    }

    if (req.params.competence === null || typeof req.params.competence === "undefined") {
        return res.status(400);
    }

    const idealDate = priceTableController.calibrateStartDate(req.params.competence);
    const programIndex = priceTableController.getProgramIndex(req.params.acronym);

    priceTableController.queryPriceTable(idealDate, idealDate, req.params.acronym).then(data => {
        if (data.length > 0) {
            const parsedData = data.map((value) => {
                return {
                    "exhibitor": value.exhibitor,
                    "monthlyPrice": value.price30Seconds * programIndex
                }
            });

            return res.json({ "competence": data[0].date, "prices": parsedData });
        }
        else {
            return res.status(404);
        }

    }).catch(err => res.status(500));
});

module.exports = router;
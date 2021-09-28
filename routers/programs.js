const router = require('express').Router();
const programController = require('../controllers/SiscomProgramController');
const requireUser = require('../middlewares/requireUser');
const moment = require('moment');

router.use(requireUser);

router.get('/:acronym', (req, res) => {
    // Validation (should be using joi, right?)
    if (req.params.acronym === null || typeof req.params.acronym === "undefined") {
        return res.status(400);
    }

    programController.queryProgramData(req.params.acronym).then(data => {
        if (data.length > 0) {
            const formattedData = data.map((value) => {
                return {
                    "id": value.Id,
                    "programInitials": value.Acronym,
                    "programName": value.Name,
                    "startTime": moment.utc(value.StartTime, moment.ISO_8601).format("HH:mm"),
                    "presentationDays": value.PresentationDays,
                    "gender": value.Gender
                }
            })[0];

            return res.json(formattedData);
        }
        else {
            return res.status(404);
        }
    }).catch(err => res.status(500));
});

module.exports = router;
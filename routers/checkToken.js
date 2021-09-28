const router = require('express').Router();
const requireUser = require('../middlewares/requireUser');

router.use(requireUser);
router.get('', (req, res) => res.json({ valid: true }));

module.exports = router;

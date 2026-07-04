const { Router } = require('express');
const ctrl = require('../controllers/monitorController');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.get('/ips', requireAuth, ctrl.ips);
router.get('/quota', requireAuth, ctrl.quota);

module.exports = router;

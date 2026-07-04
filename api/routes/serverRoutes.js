const { Router } = require('express');
const ctrl = require('../controllers/serverController');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.get('/info', requireAuth, ctrl.info);
router.get('/status', requireAuth, ctrl.status);
router.get('/speedtest', requireAuth, ctrl.speedtest);
router.post('/reboot', requireAuth, ctrl.reboot);
router.post('/restart', requireAuth, ctrl.restart);
router.post('/domain', requireAuth, ctrl.changeDomain);

module.exports = router;

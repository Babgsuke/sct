const { Router } = require('express');
const ctrl = require('../controllers/systemController');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.post('/expired', requireAuth, ctrl.cleanExpired);
router.post('/clear-cache', requireAuth, ctrl.clearCache);
router.get('/autoreboot', requireAuth, ctrl.getAutoReboot);
router.post('/autoreboot', requireAuth, ctrl.setAutoReboot);
router.post('/backup', requireAuth, ctrl.backup);

module.exports = router;

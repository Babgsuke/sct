const { Router } = require('express');
const ctrl = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.get('/whitelist', requireAuth, ctrl.list);
router.post('/whitelist', requireAuth, ctrl.add);
router.delete('/whitelist', requireAuth, ctrl.remove);
router.get('/myip', ctrl.myIp);

module.exports = router;

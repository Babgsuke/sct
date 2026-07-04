const { Router } = require('express');
const ctrl = require('../controllers/botController');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.get('/', requireAuth, ctrl.get);
router.post('/', requireAuth, ctrl.set);

module.exports = router;

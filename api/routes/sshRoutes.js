const { Router } = require('express');
const ctrl = require('../controllers/sshController');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.get('/', requireAuth, ctrl.list);
router.get('/active', requireAuth, ctrl.listActive);
router.post('/', requireAuth, ctrl.create);
router.get('/:username', requireAuth, ctrl.detail);
router.delete('/:username', requireAuth, ctrl.remove);
router.put('/:username/renew', requireAuth, ctrl.renew);
router.put('/:username/lock', requireAuth, ctrl.lock);
router.put('/:username/unlock', requireAuth, ctrl.unlock);

module.exports = router;

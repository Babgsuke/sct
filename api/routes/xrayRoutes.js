const { Router } = require('express');
const ctrl = require('../controllers/xrayController');
const requireAuth = require('../middleware/requireAuth');

function makeRouter(proto, basePath) {
  const router = Router();
  router.get('/', requireAuth, ctrl.list(proto));
  router.post('/', requireAuth, ctrl.create(proto));
  router.post('/trial', requireAuth, ctrl.trial(proto));
  router.delete('/:username', requireAuth, ctrl.remove(proto));
  router.put('/:username/renew', requireAuth, ctrl.renew(proto));
  router.put('/:username/quota', requireAuth, ctrl.quota(proto));
  router.put('/:username/iplimit', requireAuth, ctrl.iplimit(proto));
  return { basePath, router };
}

const routers = [
  makeRouter('vmess', 'vmess'),
  makeRouter('vless', 'vless'),
  makeRouter('trojan', 'trojan'),
  makeRouter('shadowsocks', 'shadowsocks'),
];

module.exports = routers;

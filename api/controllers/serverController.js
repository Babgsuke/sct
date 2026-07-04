const serverModel = require('../models/serverModel');

function info(req, res) {
  res.json(serverModel.getInfo());
}

function status(req, res) {
  res.json({ services: serverModel.getStatus() });
}

function reboot(req, res) {
  serverModel.reboot();
  res.json({ message: 'Server akan reboot dalam 2 detik' });
}

function restart(req, res) {
  res.json({ results: serverModel.restart() });
}

function changeDomain(req, res) {
  const { domain } = req.body || {};
  if (!domain || !domain.trim()) return res.status(400).json({ error: 'domain wajib diisi' });
  const d = serverModel.changeDomain(domain);
  res.json({ message: `Domain diubah ke ${d}` });
}

function speedtest(req, res) {
  const r = serverModel.speedtest();
  if (r.code !== 0) return res.status(500).json({ error: 'speedtest-cli tidak tersedia' });
  res.json({ result: r.stdout.split('\n') });
}

module.exports = { info, status, reboot, restart, changeDomain, speedtest };

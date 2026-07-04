const { loadWhitelist, addIp, removeIp } = require('../auth');

function list(req, res) {
  res.json({ whitelist: loadWhitelist(), file: '/etc/xray/api-whitelist.conf' });
}

function add(req, res) {
  const { ip } = req.body || {};
  if (!ip || !ip.trim()) return res.status(400).json({ error: 'IP wajib diisi' });
  if (addIp(ip.trim())) {
    res.json({ message: `IP ${ip} ditambahkan ke whitelist`, whitelist: loadWhitelist() });
  } else {
    res.status(400).json({ error: `IP ${ip} sudah ada di whitelist` });
  }
}

function remove(req, res) {
  const { ip } = req.body || {};
  if (!ip || !ip.trim()) return res.status(400).json({ error: 'IP wajib diisi' });
  if (removeIp(ip.trim())) {
    res.json({ message: `IP ${ip} dihapus dari whitelist`, whitelist: loadWhitelist() });
  } else {
    res.status(404).json({ error: `IP ${ip} tidak ditemukan di whitelist` });
  }
}

function myIp(req, res) {
  const clientIp = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.ip;
  res.json({ ip: clientIp });
}

module.exports = { list, add, remove, myIp };

const systemModel = require('../models/systemModel');

function cleanExpired(req, res) {
  systemModel.cleanExpired();
  res.json({ message: 'Akun expired dibersihkan' });
}

function clearCache(req, res) {
  systemModel.clearCache();
  res.json({ message: 'Cache & log dibersihkan' });
}

function getAutoReboot(req, res) {
  res.json({ auto_reboot_hour: systemModel.getAutoReboot() });
}

function setAutoReboot(req, res) {
  const hour = systemModel.setAutoReboot(req.body?.hour || 5);
  res.json({ message: `Auto reboot jam ${hour}:00` });
}

function backup(req, res) {
  const file = systemModel.backup();
  res.json({ message: 'Backup berhasil', file });
}

module.exports = { cleanExpired, clearCache, getAutoReboot, setAutoReboot, backup };

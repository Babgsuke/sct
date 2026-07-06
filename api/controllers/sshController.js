const sshModel = require('../models/sshModel');

function list(req, res) {
  const users = sshModel.listUsers();
  res.json({ users, total: users.length });
}

function listActive(req, res) {
  res.json({ active: sshModel.listActive() });
}

function create(req, res) {
  const result = sshModel.createUser(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ message: 'SSH user created', data: result.data, text: result.text, html: result.html, base64: result.base64 });
}

function remove(req, res) {
  const result = sshModel.deleteUser(req.params.username);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ message: result.message });
}

function renew(req, res) {
  const result = sshModel.renewUser(req.params.username, req.body?.days || 30);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ message: `Diperpanjang hingga ${result.exp}`, exp: result.exp });
}

function lock(req, res) {
  const result = sshModel.lockUser(req.params.username);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ message: `User ${req.params.username} di-lock` });
}

function unlock(req, res) {
  const result = sshModel.unlockUser(req.params.username);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ message: `User ${req.params.username} di-unlock` });
}

function detail(req, res) {
  const result = sshModel.detailUser(req.params.username);
  if (result.error) return res.status(404).json({ error: result.error });
  res.json(result.data);
}

function trial(req, res) {
  const result = sshModel.trialUser(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ message: 'Trial SSH created', data: result.data, text: result.text, html: result.html, base64: result.base64 });
}

module.exports = { list, listActive, create, remove, renew, lock, unlock, detail, trial };

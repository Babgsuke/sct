const xrayModel = require('../models/xrayModel');

const LABELS = {
  vmess: 'VMess',
  vless: 'VLESS',
  trojan: 'Trojan',
  shadowsocks: 'Shadowsocks',
};

function list(proto) {
  return (req, res) => {
    const users = xrayModel.listUsers(proto);
    res.json({ users, total: users.length });
  };
}

function create(proto) {
  return (req, res) => {
    const result = xrayModel.createUser(proto, req.body || {});
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: `${LABELS[proto]} created`, data: result.data, text: result.text, html: result.html, base64: result.base64 });
  };
}

function remove(proto) {
  return (req, res) => {
    const result = xrayModel.deleteUser(proto, req.params.username);
    if (result.error) return res.status(404).json({ error: result.error });
    res.json({ message: result.message });
  };
}

function renew(proto) {
  return (req, res) => {
    const exp = xrayModel.renewUser(proto, req.params.username, req.body?.days || 30);
    res.json({ message: `${LABELS[proto]} ${req.params.username} diperpanjang hingga ${exp}`, exp });
  };
}

function quota(proto) {
  return (req, res) => {
    const q = xrayModel.setQuota(proto, req.params.username, req.body?.quota || 0);
    res.json({ message: `Quota ${LABELS[proto]} ${req.params.username} = ${q} GB` });
  };
}

function iplimit(proto) {
  return (req, res) => {
    const ip = xrayModel.setIpLimit(proto, req.params.username, req.body?.iplimit || 0);
    res.json({ message: `IP limit ${LABELS[proto]} ${req.params.username} = ${ip}` });
  };
}

function trial(proto) {
  return (req, res) => {
    const result = xrayModel.trialUser(proto, req.body || {});
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: `Trial ${LABELS[proto]} created`, data: result.data, text: result.text, html: result.html, base64: result.base64 });
  };
}

module.exports = { list, create, remove, renew, quota, iplimit, trial };

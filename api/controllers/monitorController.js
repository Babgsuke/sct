const fs = require('fs');
const path = require('path');
const { readFile } = require('../utils/helpers');

const LIMIT_DIRS = {
  ssh: '/etc/kyt/limit/ssh/ip',
  vmess: '/etc/kyt/limit/vmess/ip',
  vless: '/etc/kyt/limit/vless/ip',
  trojan: '/etc/kyt/limit/trojan/ip',
};

function scanDir(dir) {
  const users = {};
  try {
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isFile()) users[f] = readFile(fp);
    });
  } catch {}
  return users;
}

function ips(req, res) {
  const result = {};
  Object.entries(LIMIT_DIRS).forEach(([proto, dir]) => { result[proto] = scanDir(dir); });
  res.json(result);
}

function quota(req, res) {
  const result = {};
  ['ssh', 'vmess', 'vless', 'trojan'].forEach(proto => {
    const dir = `/etc/${proto}`;
    const users = {};
    try {
      fs.readdirSync(dir).forEach(f => {
        if (f.endsWith('.db')) return;
        const fp = path.join(dir, f);
        if (fs.statSync(fp).isFile()) users[f] = readFile(fp);
      });
    } catch {}
    result[proto] = users;
  });
  res.json(result);
}

module.exports = { ips, quota };

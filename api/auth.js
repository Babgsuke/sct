const fs = require('fs');

const WHITELIST_FILE = '/etc/xray/api-whitelist.conf';

function loadWhitelist() {
  try {
    const raw = fs.readFileSync(WHITELIST_FILE, 'utf8');
    return raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}

function saveWhitelist(ips) {
  const dir = require('path').dirname(WHITELIST_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const content = '# SCT API Server — IP Whitelist\n' +
    '# Satu IP per baris. Baris diawali # akan diabaikan.\n' +
    '# Gunakan 0.0.0.0 untuk mengizinkan semua IP.\n\n' +
    ips.map(ip => ip.trim()).filter(Boolean).join('\n') + '\n';
  fs.writeFileSync(WHITELIST_FILE, content);
}

function addIp(ip) {
  const ips = loadWhitelist();
  if (ips.includes(ip)) return false;
  ips.push(ip);
  saveWhitelist(ips);
  return true;
}

function removeIp(ip) {
  const ips = loadWhitelist();
  const filtered = ips.filter(i => i !== ip);
  if (filtered.length === ips.length) return false;
  saveWhitelist(filtered);
  return true;
}

module.exports = { loadWhitelist, saveWhitelist, addIp, removeIp };

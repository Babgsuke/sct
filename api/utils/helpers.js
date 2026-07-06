const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function execCmd(cmd, timeout = 30000) {
  try {
    const out = execSync(cmd, { timeout, shell: '/bin/bash' }).toString().trim();
    return { code: 0, stdout: out, stderr: '' };
  } catch (e) {
    return {
      code: e.status || 1,
      stdout: (e.stdout || '').toString().trim(),
      stderr: (e.stderr || '').toString().trim() || e.message,
    };
  }
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8').trim(); } catch { return ''; }
}

function writeFile(p, text) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text + '\n');
}

function appendLine(p, text) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, text + '\n');
}

function removeFile(p) {
  try { fs.unlinkSync(p); } catch {}
}

function getDomain() {
  return readFile('/etc/xray/domain') || readFile('/root/domain') || '';
}

function getMyIp() {
  return execCmd('curl -sS ipv4.icanhazip.com').stdout;
}

function makeDate(daysFromNow = 0) {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0];
}

function toHtml(lines) {
  return lines.map(line => {
    const t = line.trim();
    if (/^[━═\-─]+$/.test(t)) return `<b>${t}</b>`;
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const val = line.slice(idx + 1).trim();
      if (val) return `<b>${line.slice(0, idx).trim()}:</b> <code>${val}</code>`;
    }
    return `<b>${t}</b>`;
  }).join('\n');
}

function randomString(length, chars = 'a-zA-Z0-9') {
  return execCmd(`tr -dc '${chars}' < /dev/urandom | head -c${length}`).stdout;
}

module.exports = { execCmd, readFile, writeFile, appendLine, removeFile, getDomain, getMyIp, makeDate, toHtml, randomString };

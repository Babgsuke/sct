const fs = require('fs');
const { execCmd, readFile, writeFile, appendLine, removeFile, getDomain, makeDate, toHtml, randomString } = require('../utils/helpers');

const SSH_DB = '/etc/ssh/.ssh.db';
const LIMIT_DIR = '/etc/kyt/limit/ssh/ip';
const WWW_DIR = '/var/www/html';

function listUsers() {
  const r = execCmd("awk -F: '$3 >= 1000 && $1 != \"nobody\" {print $1}' /etc/passwd");
  return r.stdout.split('\n').filter(Boolean).map(user => {
    const exp = execCmd(`chage -l ${user} 2>/dev/null | grep 'Account expires' | awk -F': ' '{print $2}'`).stdout;
    const st = execCmd(`passwd -S ${user} 2>/dev/null | awk '{print $2}'`).stdout;
    const db = execCmd(`grep -w '${user}' ${SSH_DB} 2>/dev/null | tail -1`).stdout;
    const parts = db.split(/\s+/);
    return {
      username: user,
      exp: exp || '-',
      status: st === 'L' ? 'locked' : 'unlocked',
      quota_gb: parts[3] || '0',
      iplimit: parts[4] || '0',
    };
  });
}

function listActive() {
  const log = fs.existsSync('/var/log/auth.log') ? '/var/log/auth.log' : '/var/log/secure';
  if (!fs.existsSync(log)) return [];
  const active = [];
  const drop = execCmd(`cat ${log} | grep -i dropbear | grep -i 'Password auth succeeded' | awk '{print $10, $12}' | sort -u`);
  drop.stdout.split('\n').filter(Boolean).forEach(line => {
    const p = line.split(/\s+/);
    active.push({ username: p[0], ip: p[1] || '', via: 'dropbear' });
  });
  const sshd = execCmd(`cat ${log} | grep -i sshd | grep -i 'Accepted password for' | awk '{print $9, $11}' | sort -u`);
  sshd.stdout.split('\n').filter(Boolean).forEach(line => {
    const p = line.split(/\s+/);
    active.push({ username: p[0], ip: p[1] || '', via: 'ssh' });
  });
  return active;
}

function formatSshOutput({ username, password, domain, ip, days, exp, quota, iplimit, minutes }) {
  const tgl = new Date();
  const expe = minutes ? new Date(Date.now() + minutes * 60000) : new Date(Date.now() + days * 86400000);
  const fmt = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en', { month: 'short' })}, ${d.getFullYear()}`;
  const tnggl = fmt(tgl);
  const expeStr = fmt(expe);

  const DIV = '════════════════════';

  const PAYLOADS = [
    `Payload WSS      : GET wss://BUG.COM/ HTTP/1.1[crlf]Host: ${domain}[crlf]Upgrade: websocket[crlf][crlf]`,
    `Payload WS       : GET / HTTP/1.1[crlf]Host: [host][crlf]Connection: Upgrade[crlf]User-Agent: [ua][crlf]Upgrade: websocket[crlf][crlf]`,
    `Payload TLS      : GET wss://${domain}/ HTTP/1.1[crlf]Host: [host][crlf]Connection: Upgrade[crlf]User-Agent: [ua][crlf]Upgrade: websocket[crlf][crlf]`,
    `Payload ENCD     : HEAD / HTTP/1.1[crlf]Host: Masukan_Bug[crlf][crlf]PATCH / HTTP/1.1[crlf]Host: [host][crlf]Upgrade: websocket[crlf][crlf][split]HTTP/ 1[crlf][crlf]`,
  ];

  const lines = [
    DIV,
    '       Format SSH OVPN Account',
    DIV,
    `Username         : ${username}`,
    `Password         : ${password}`,
    DIV,
    `IP               : ${ip}`,
    `Host             : ${domain}`,
    `Port OpenSSH     : 443, 80, 22`,
    `Port Dropbear    : 109, 143`,
    `Port SSH WS      : 80, 8080, 2082`,
    `Port SSH SSL WS  : 443`,
    `Port SSH UDP     : 1-65535`,
    `Port SSL/TLS     : 443-8443`,
    `Port OVPN WS SSL : 443`,
    `Port OVPN SSL    : 443`,
    `Port OVPN TCP    : 1194`,
    `Port OVPN UDP    : 2200`,
    `BadVPN UDP       : 7100, 7300, 7900`,
    DIV,
    ...PAYLOADS.flatMap(p => [DIV, p]),
    DIV,
    `Aktif Selama     : ${minutes ? `${minutes} Menit` : `${days} Hari`}`,
    `Quota            : ${quota} GB`,
    `IP Limit         : ${iplimit}`,
    `Dibuat Pada      : ${tnggl}`,
    `Berakhir Pada    : ${expeStr}`,
    DIV,
  ];
  const text = lines.join('\n');
  const html = toHtml(lines);

  return {
    text,
    html,
    base64: Buffer.from(text).toString('base64'),
  };
}

function createUser({ username, password, quota = 0, iplimit = 0, days = 30 }) {
  const exp = makeDate(days);
  const r = execCmd(`useradd -e ${exp} -s /bin/false -M ${username} && echo -e '${password}\\n${password}' | passwd ${username} &>/dev/null`);
  if (r.code !== 0) return { error: `Gagal: ${r.stderr}` };

  if (+iplimit > 0) {
    fs.mkdirSync(LIMIT_DIR, { recursive: true });
    writeFile(`${LIMIT_DIR}/${username}`, String(iplimit));
  }
  if (+quota > 0) writeFile(`/etc/ssh/${username}`, String(+quota * 1073741824));
  appendLine(SSH_DB, `#ssh# ${username} ${password} ${quota} ${iplimit} ${exp}`);
  writeFile(`${WWW_DIR}/ssh-${username}.txt`, `Username: ${username}\nPassword: ${password}\nHost: ${getDomain()}\nExp: ${exp}`);

  const output = formatSshOutput({
    username, password, domain: getDomain(), ip: execCmd('curl -sS ipv4.icanhazip.com').stdout,
    days, exp, quota, iplimit,
  });

  return { data: { username, exp }, ...output };
}

function deleteUser(username) {
  const r = execCmd(`id ${username} 2>/dev/null`);
  if (r.code !== 0) return { error: `User ${username} tidak ditemukan` };
  execCmd(`userdel -f ${username} 2>/dev/null`);
  execCmd(`sed -i '/${username}/d' ${SSH_DB}`);
  removeFile(`/etc/ssh/${username}`);
  removeFile(`${LIMIT_DIR}/${username}`);
  removeFile(`${WWW_DIR}/ssh-${username}.txt`);
  return { message: `User ${username} dihapus` };
}

function renewUser(username, days = 30) {
  const exp = makeDate(days);
  const r = execCmd(`chage -E ${exp} ${username} 2>/dev/null`);
  if (r.code !== 0) return { error: `User ${username} tidak ditemukan` };
  return { exp };
}

function lockUser(username) {
  const r = execCmd(`passwd -l ${username} 2>/dev/null`);
  if (r.code !== 0) return { error: `Gagal lock: ${r.stderr}` };
  return {};
}

function unlockUser(username) {
  const r = execCmd(`passwd -u ${username} 2>/dev/null`);
  if (r.code !== 0) return { error: `Gagal unlock: ${r.stderr}` };
  return {};
}

function detailUser(username) {
  const r = execCmd(`id ${username} 2>/dev/null`);
  if (r.code !== 0) return { error: 'User tidak ditemukan' };
  const exp = execCmd(`chage -l ${username} | grep 'Account expires' | awk -F': ' '{print $2}'`).stdout;
  const st = execCmd(`passwd -S ${username} | awk '{print $2}'`).stdout;
  const db = execCmd(`grep -w ${username} ${SSH_DB} 2>/dev/null | tail -1`).stdout;
  const parts = db.split(/\s+/);
  return {
    data: {
      username, exp,
      status: st === 'L' ? 'locked' : 'unlocked',
      password: parts[2] || '',
      quota_gb: parts[3] || '0',
      iplimit: parts[4] || '0',
    },
  };
}

function trialUser({ minutes = 60 } = {}) {
  const username = 'Trial-' + randomString(4, 'X-Z0-9');
  const password = randomString(6, 'a-zA-Z0-9');

  const expDate = new Date(Date.now() + minutes * 60000);
  const exp = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;

  const r = execCmd(`useradd -e ${exp} -s /bin/false -M ${username} && echo -e '${password}\\n${password}' | passwd ${username} &>/dev/null`);
  if (r.code !== 0) return { error: `Gagal: ${r.stderr}` };

  const iplimit = 99;
  fs.mkdirSync(LIMIT_DIR, { recursive: true });
  writeFile(`${LIMIT_DIR}/${username}`, String(iplimit));

  const quota = 0;
  appendLine(SSH_DB, `#ssh# ${username} ${password} ${quota} ${iplimit} ${exp}`);
  writeFile(`${WWW_DIR}/ssh-${username}.txt`, `Username: ${username}\nPassword: ${password}\nHost: ${getDomain()}\nExp: ${exp}`);

  execCmd(`echo "userdel -f ${username}" | at now + ${minutes} minutes 2>/dev/null`);

  const output = formatSshOutput({
    username, password, domain: getDomain(), ip: execCmd('curl -sS ipv4.icanhazip.com').stdout,
    days: 0, exp, quota, iplimit, minutes,
  });

  return { data: { username, exp }, ...output };
}

module.exports = { listUsers, listActive, createUser, deleteUser, renewUser, lockUser, unlockUser, detailUser, trialUser };

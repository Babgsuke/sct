const { execCmd, readFile, writeFile } = require('../utils/helpers');

const SBIN = '/usr/local/sbin';
const AUTOREBOOT_CONF = '/home/daily_reboot';
const DB_FILES = {
  ssh: '/etc/ssh/.ssh.db',
  vmess: '/etc/vmess/.vmess.db',
  vless: '/etc/vless/.vless.db',
  trojan: '/etc/trojan/.trojan.db',
  shadowsocks: '/etc/shadowsocks/.shadowsocks.db',
};

function cleanExpired() {
  execCmd(`${SBIN}/xp 2>/dev/null`);
}

function clearCache() {
  ['/var/log/nginx/access.log', '/var/log/xray/access.log', '/var/log/syslog']
    .forEach(f => execCmd(`echo > ${f}`));
}

function getAutoReboot() {
  return readFile(AUTOREBOOT_CONF);
}

function setAutoReboot(hour = 5) {
  writeFile(AUTOREBOOT_CONF, String(hour));
  execCmd('rm -f /etc/cron.d/daily_reboot');
  execCmd(`echo '0 ${hour} * * * root /sbin/reboot' > /etc/cron.d/daily_reboot`);
  execCmd('service cron restart 2>/dev/null');
  return hour;
}

function backup() {
  const bdir = '/root/backup';
  execCmd(`rm -rf ${bdir} && mkdir -p ${bdir}`);
  ['/etc/passwd', '/etc/group', '/etc/shadow', '/etc/gshadow', '/etc/crontab']
    .forEach(f => execCmd(`cp ${f} ${bdir}/`));
  Object.values(DB_FILES).forEach(db => execCmd(`cp ${db} ${bdir}/`));
  execCmd('cp -r /var/lib/kyt /root/backup/ 2>/dev/null');
  execCmd('cp -r /etc/kyt /root/backup/ 2>/dev/null');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  execCmd(`cd /root && tar -czf backup-${ts}.tar.gz backup/`);
  return `backup-${ts}.tar.gz`;
}

module.exports = { cleanExpired, clearCache, getAutoReboot, setAutoReboot, backup };

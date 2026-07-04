const fs = require('fs');
const crypto = require('crypto');
const { execCmd, readFile, writeFile, appendLine, removeFile, getDomain, makeDate } = require('../utils/helpers');

const XRAY_CONFIG = '/etc/xray/config.json';
const WWW_DIR = '/var/www/html';

const DB_FILES = {
  vmess: '/etc/vmess/.vmess.db',
  vless: '/etc/vless/.vless.db',
  trojan: '/etc/trojan/.trojan.db',
  shadowsocks: '/etc/shadowsocks/.shadowsocks.db',
};

const LIMIT_DIRS = {
  vmess: '/etc/kyt/limit/vmess/ip',
  vless: '/etc/kyt/limit/vless/ip',
  trojan: '/etc/kyt/limit/trojan/ip',
};

const PROTOCOLS = {
  vmess: {
    markers: [['#vmess$', '###'], ['#vmessgrpc$', '###']],
    track: '^### ', uidKey: 'id',
    extra: ',"alterId": 0',
  },
  vless: {
    markers: [['#vless$', '#&'], ['#vlessgrpc$', '#&']],
    track: '^#& ', uidKey: 'id',
    extra: '',
  },
  trojan: {
    markers: [['#trojanws$', '#!'], ['#trojangrpc$', '#!']],
    track: '^#! ', uidKey: 'password',
    extra: '',
  },
  shadowsocks: {
    markers: [['#ssws$', '#!#'], ['#ssgrpc$', '#!#']],
    track: '^#!# ', uidKey: 'password',
    extra: ',"method": "aes-128-gcm"',
  },
};

function listUsers(proto) {
  const cfg = PROTOCOLS[proto];
  const r = execCmd(`grep -E '${cfg.track}' ${XRAY_CONFIG} | cut -d' ' -f2-3 | sort | uniq`);
  return r.stdout.split('\n').filter(Boolean).map(line => {
    const p = line.split(/\s+/);
    const uname = p[0], exp = p[1] || '-';
    const db = execCmd(`grep -w '${uname}' ${DB_FILES[proto]} 2>/dev/null | head -1`).stdout;
    const dp = db.split(/\s+/);
    return {
      username: uname, exp,
      uuid: dp[3] || '',
      quota_gb: dp[4] || '0',
      iplimit: dp[5] || '0',
    };
  });
}

function formatXrayOutput(proto, { username, uuid, domain, ip, city, isp, days, exp, quota, iplimit }) {
  const tgl = new Date();
  const expe = new Date(Date.now() + days * 86400000);
  const fmt = (d) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en', { month: 'short' })}, ${d.getFullYear()}`;
  const tnggl = fmt(tgl);
  const expeStr = fmt(expe);

  const LINKS = {
    vmess: [
      `Link TLS      : vmess://${Buffer.from(`{"v":"2","ps":"${username}","add":"${domain}","port":"443","id":"${uuid}","aid":"0","net":"ws","path":"/vmess","type":"none","host":"${domain}","tls":"tls"}`).toString('base64')}`,
      `Link WS       : vmess://${Buffer.from(`{"v":"2","ps":"${username}","add":"${domain}","port":"80","id":"${uuid}","aid":"0","net":"ws","path":"/vmess","type":"none","host":"${domain}","tls":"none"}`).toString('base64')}`,
      `Link GRPC     : vmess://${Buffer.from(`{"v":"2","ps":"${username}","add":"${domain}","port":"443","id":"${uuid}","aid":"0","net":"grpc","path":"vmess-grpc","type":"none","host":"${domain}","tls":"tls"}`).toString('base64')}`,
    ],
    vless: [
      `Link TLS      : vless://${uuid}@${domain}:443?path=%2Fvless&security=tls&encryption=none&host=${domain}&type=ws&sni=${domain}#${username}`,
      `Link WS       : vless://${uuid}@${domain}:80?path=%2Fvless&security=none&encryption=none&host=${domain}&type=ws#${username}`,
      `Link GRPC     : vless://${uuid}@${domain}:443?mode=gun&security=tls&encryption=none&type=grpc&serviceName=vless-grpc&sni=${domain}#${username}`,
    ],
    trojan: [
      `Link TLS      : trojan://${uuid}@${domain}:443?path=%2Ftrojan-ws&security=tls&host=${domain}&type=ws&sni=${domain}#${username}`,
      `Link WS       : trojan://${uuid}@${domain}:80?path=%2Ftrojan-ws&security=none&host=${domain}&type=ws#${username}`,
      `Link GRPC     : trojan://${uuid}@${domain}:443?mode=gun&security=tls&type=grpc&serviceName=trojan-grpc&sni=${domain}#${username}`,
    ],
    shadowsocks: [
      `Link TLS      : ss://${Buffer.from(`aes-128-gcm:${uuid}`).toString('base64')}@${domain}:443?path=%2Fss-ws&security=tls&encryption=none&type=ws#${username}`,
      `Link WS       : ss://${Buffer.from(`aes-128-gcm:${uuid}`).toString('base64')}@${domain}:80?path=%2Fss-ws&security=none&encryption=none&type=ws#${username}`,
      `Link GRPC     : ss://${Buffer.from(`aes-128-gcm:${uuid}`).toString('base64')}@${domain}:443?mode=gun&security=tls&encryption=none&type=grpc&serviceName=ss-grpc&sni=${domain}#${username}`,
    ],
  };

  const LABEL = { vmess: 'VMESS', vless: 'VLESS', trojan: 'TROJAN', shadowsocks: 'SHADOWSOCKS' };
  const PORTS = {
    vmess: ['Port TLS      : 400,8443', 'port WS       : 80,8880,8080,2082'],
    vless: ['Port TLS      : 400,8443', 'port WS       : 80,8880,8080,2082'],
    trojan: ['Port TLS      : 400,8443', 'port WS       : 80,8880,8080,2082'],
    shadowsocks: ['Port TLS      : 400,8443', 'port WS       : 80,8880,8080,2082'],
  };
  const PATHS = {
    vmess: ['Path          : /vmess', 'ServiceName   : vmess-grpc'],
    vless: ['Path          : /vless', 'ServiceName   : vless-grpc'],
    trojan: ['Path          : /trojan-ws', 'ServiceName   : trojan-grpc'],
    shadowsocks: ['Path          : /ss-ws', 'ServiceName   : ss-grpc'],
  };

  const uidKey = proto === 'vmess' || proto === 'vless' ? 'UUID' : 'Password';

  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `      ${LABEL[proto]} XRAY`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Remarks       : ${username}`,
    `Domain        : ${domain}`,
    `Quota         : ${quota} GB`,
    `IP Limit      : ${iplimit}`,
    ...PORTS[proto],
    `${uidKey.padEnd(14)}: ${uuid}`,
    `Location      : ${city}`,
    `ISP           : ${isp}`,
    `Network       : ws & grpc`,
    ...PATHS[proto],
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...LINKS[proto],
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Aktif Selama   : ${days} Hari`,
    `Dibuat Pada    : ${tnggl}`,
    `Berakhir Pada  : ${expeStr}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ];

  const text = lines.join('\n');
  return { text, base64: Buffer.from(text).toString('base64') };
}

function createUser(proto, { username, quota = 0, iplimit = 0, days = 30 }) {
  if (!username) return { error: 'username wajib' };
  const exists = execCmd(`grep -w '${username}' ${XRAY_CONFIG}`).stdout;
  if (exists) return { error: `Username ${username} sudah ada` };

  const uid = crypto.randomUUID();
  const exp = makeDate(days);
  const cfg = PROTOCOLS[proto];

  cfg.markers.forEach(([marker, trackM]) => {
    const inject = `\\${trackM} ${username} ${exp}\\n}},{\\"${cfg.uidKey}\\": \\"${uid}\\"${cfg.extra},\\"email\\": \\"${username}\\"`;
    execCmd(`sed -i '/${marker}/a\\${inject}' ${XRAY_CONFIG}`);
  });

  execCmd('systemctl restart xray 2>/dev/null');
  appendLine(DB_FILES[proto], `### ${username} ${exp} ${uid} ${quota} ${iplimit}`);

  if (+iplimit > 0 && LIMIT_DIRS[proto]) {
    fs.mkdirSync(LIMIT_DIRS[proto], { recursive: true });
    writeFile(`${LIMIT_DIRS[proto]}/${username}`, String(iplimit));
  }
  if (+quota > 0) writeFile(`/etc/${proto}/${username}`, String(+quota * 1073741824));
  writeFile(`${WWW_DIR}/${proto}-${username}.txt`,
    `Username: ${username}\nUUID: ${uid}\nDomain: ${getDomain()}\nExp: ${exp}\nQuota: ${quota} GB`);

  const domain = getDomain();
  const ip = execCmd('curl -sS ipv4.icanhazip.com').stdout;
  const city = readFile('/etc/xray/city');
  const isp = readFile('/etc/xray/isp');

  const output = formatXrayOutput(proto, {
    username, uuid: uid, domain, ip, city, isp, days, exp, quota, iplimit,
  });

  return { data: { username, uuid: uid, exp, quota_gb: String(quota), iplimit: String(iplimit) }, ...output };
}

function deleteUser(proto, username) {
  const cfg = PROTOCOLS[proto];
  const exists = execCmd(`grep -w '${username}' ${XRAY_CONFIG}`).stdout;
  if (!exists) return { error: `User ${username} tidak ditemukan` };

  const tag = cfg.track.replace('^', '');
  execCmd(`sed -i '/${tag}${username} /,/'^},{/'d' ${XRAY_CONFIG}`);
  execCmd(`sed -i '/${username}/d' ${DB_FILES[proto]}`);
  if (LIMIT_DIRS[proto]) removeFile(`${LIMIT_DIRS[proto]}/${username}`);
  removeFile(`/etc/${proto}/${username}`);
  removeFile(`/etc/limit/${proto}/${username}`);
  removeFile(`${WWW_DIR}/${proto}-${username}.txt`);
  execCmd('systemctl restart xray 2>/dev/null');
  return { message: `User ${username} dihapus` };
}

function renewUser(proto, username, days = 30) {
  const cfg = PROTOCOLS[proto];
  const exp = makeDate(days);
  const tag = cfg.track.replace('^', '');
  execCmd(`sed -i 's/${tag}${username} [0-9-]*/${tag}${username} ${exp}/' ${XRAY_CONFIG}`);
  execCmd(`sed -i 's/^### ${username} [0-9-]*/### ${username} ${exp}/' ${DB_FILES[proto]}`);
  return exp;
}

function setQuota(proto, username, quotaGb = 0) {
  if (+quotaGb > 0) writeFile(`/etc/${proto}/${username}`, String(+quotaGb * 1073741824));
  return quotaGb;
}

function setIpLimit(proto, username, iplimit = 0) {
  if (+iplimit > 0 && LIMIT_DIRS[proto]) {
    fs.mkdirSync(LIMIT_DIRS[proto], { recursive: true });
    writeFile(`${LIMIT_DIRS[proto]}/${username}`, String(iplimit));
  }
  return iplimit;
}

module.exports = { listUsers, createUser, deleteUser, renewUser, setQuota, setIpLimit, PROTOCOLS };

const { execCmd, readFile, getMyIp, getDomain } = require('../utils/helpers');

function getInfo() {
  const ip = getMyIp();
  const domain = getDomain();
  return {
    ip,
    domain,
    isp: readFile('/etc/xray/isp'),
    city: readFile('/etc/xray/city'),
    ram: execCmd("free -m | awk 'NR==2{printf \"%.0f/%.0f MB (%.0f%%)\",$3,$2,$3*100/$2}'").stdout,
    uptime: execCmd("uptime -p | cut -d' ' -f2-").stdout,
    cpu: execCmd("ps aux | awk 'BEGIN{s=0}{s+=$3}END{printf \"%.1f%%\",s}'").stdout,
    load: execCmd("cat /proc/loadavg | awk '{print $1,$2,$3}'").stdout,
    disk: execCmd("df -h / | awk 'NR==2{printf \"%s/%s (%s)\",$3,$2,$5}'").stdout,
  };
}

function getStatus() {
  const services = ['xray', 'nginx', 'haproxy', 'ssh', 'dropbear', 'openvpn', 'cron', 'ws'];
  const result = {};
  services.forEach(s => {
    const r = execCmd(`systemctl is-active ${s}`);
    result[s] = r.code === 0 ? r.stdout : 'inactive';
  });
  return result;
}

function reboot() {
  execCmd('sleep 2 && reboot &');
}

function restart() {
  const services = ['xray', 'nginx', 'haproxy', 'ssh', 'dropbear', 'openvpn', 'cron', 'ws'];
  const results = {};
  services.forEach(s => {
    const r = execCmd(`systemctl restart ${s} 2>&1`);
    results[s] = r.code === 0 ? 'ok' : 'gagal';
  });
  return results;
}

function changeDomain(domain) {
  const { writeFile } = require('../utils/helpers');
  writeFile('/etc/xray/domain', domain.trim());
  writeFile('/root/domain', domain.trim());
  execCmd(`sed -i 's/domain=.*/domain="${domain.trim()}"/' /var/lib/kyt/ipvps.conf 2>/dev/null`);
  return domain.trim();
}

function speedtest() {
  const r = execCmd('speedtest-cli --simple 2>/dev/null || speedtest-cli 2>/dev/null');
  return r;
}

module.exports = { getInfo, getStatus, reboot, restart, changeDomain, speedtest };

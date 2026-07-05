#!/bin/bash
# SCT (Saerah Store Tunnel) — Full Uninstaller
# Menghapus SELURUH komponen sct dari VPS
# Jalankan: bash uninstall.sh

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

msg() { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC} $*"; }
title(){ echo -e "\n${BOLD}━━━ $* ━━━${NC}\n"; }

trap 'echo -e "\n${RED}[ABORT]${NC} user cancelled"; exit 1' INT

echo -e "${BOLD}"
echo "╔═══════════════════════════════════════════╗"
echo "║      SCT UNINSTALLER                      ║"
echo "║      Saerah Store Tunnel — Cleanup        ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${RED}${BOLD}PERINGATAN:${NC} Script ini akan menghapus SEMUA komponen sct"
echo -e "termasuk Xray, HAProxy, Nginx, OpenVPN, Dropbear, menu,"
echo -e "database user, sertifikat SSL, dan semua data terkait."
echo ""
echo -e "${YELLOW}Pastikan kamu backup data penting terlebih dulu!${NC}"
echo ""

read -rp "Ketik 'uninstall' untuk lanjut: " confirm
if [[ "$confirm" != "uninstall" ]]; then
  echo "Dibatalkan."
  exit 1
fi

title "1. STOP & DISABLE SYSTEMD SERVICES"

SERVICES=(
  xray.service
  runn.service
  ws.service
  socks.service
  sship.service
  vmip.service
  vlip.service
  trip.service
  udp-mini-1.service
  udp-mini-2.service
  udp-mini-3.service
  limitvmess.service
  limitvless.service
  limittrojan.service
  limitshadowsocks.service
  api-server.service
  openvpn-server@server-tcp
  openvpn-server@server-udp
  openvpn.service
  rc-local.service
)

for svc in "${SERVICES[@]}"; do
  systemctl is-active --quiet "$svc" 2>/dev/null && {
    systemctl stop "$svc" 2>/dev/null
    msg "Stopped $svc"
  }
  systemctl is-enabled --quiet "$svc" 2>/dev/null && {
    systemctl disable "$svc" 2>/dev/null
    msg "Disabled $svc"
  }
done

title "2. REMOVE SYSTEMD SERVICE FILES"

UNITDIR="/etc/systemd/system"
for unit in \
  xray.service xray.service.d runn.service \
  ws.service socks.service \
  sship.service vmip.service vlip.service trip.service \
  udp-mini-1.service udp-mini-2.service udp-mini-3.service \
  limitvmess.service limitvless.service limittrojan.service limitshadowsocks.service \
  api-server.service; do
  rm -rf "$UNITDIR/$unit" 2>/dev/null
done

systemctl daemon-reload
msg "Systemd service files removed"

title "3. REMOVE SCT DIRECTORIES"

SCT_DIRS=(
  /etc/xray
  /etc/vmess
  /etc/vless
  /etc/trojan
  /etc/shadowsocks
  /etc/ssh
  /etc/bot
  /etc/kyt
  /etc/openvpn
  /var/log/xray
  /var/lib/kyt
  /var/run/xray
  /usr/local/kyt
  /usr/local/api-server
  /usr/local/share/xray
  /usr/local/ddos
  /usr/bin/xray
  /run/xray
  /tmp/nameserver
)

for d in "${SCT_DIRS[@]}"; do
  [ -d "$d" ] && rm -rf "$d" && msg "Removed $d"
done

if [ -d /usr/local/sbin ]; then
  MENU_FILES=$(find /usr/local/sbin -maxdepth 1 -type f 2>/dev/null | wc -l)
  if [ "$MENU_FILES" -gt 0 ] && [ "$MENU_FILES" -lt 200 ]; then
    rm -f /usr/local/sbin/* 2>/dev/null
    msg "Cleaned /usr/local/sbin"
  fi
fi

if [ -d /root/.acme.sh ]; then
  warn "/root/.acme.sh/ ditemukan (sertifikat SSL)"
  warn "Hapus? (SSL cert akan hilang permanen)"
  read -rp "Hapus /root/.acme.sh/? [y/N]: " del_acme
  [[ "$del_acme" =~ ^[yY] ]] && rm -rf /root/.acme.sh && msg "Removed /root/.acme.sh"
fi

rm -rf /root/.config/rclone 2>/dev/null

if [ -d /var/www/html ]; then
  find /var/www/html -type f ! -name 'index.html' -delete 2>/dev/null
  find /var/www/html -type d -empty -delete 2>/dev/null
  msg "Cleaned /var/www/html"
fi

title "4. REMOVE SCT BINARIES & SCRIPTS"

FILES=(
  /usr/local/bin/xray
  /usr/bin/ws
  /usr/bin/ws.py
  /usr/bin/limit-ip
  /usr/bin/limit-ip-ssh
  /usr/bin/tun.conf
  /usr/sbin/ftvpn
  /etc/ipserver
  /etc/banner.txt
  /etc/xray/api-whitelist.conf
)

for f in "${FILES[@]}"; do
  [ -e "$f" ] && rm -f "$f" && msg "Removed $f"
done

title "5. REMOVE SCT CONFIG FILES"

CONFIG_FILES=(
  /etc/haproxy/haproxy.cfg
  /etc/haproxy/hap.pem
  /etc/nginx/nginx.conf
  /etc/nginx/conf.d/xray.conf
  /etc/default/dropbear
  /etc/rc.local
  /etc/msmtprc
  /etc/iptables.up.rules
  /etc/apt/sources.list.d/haproxy.list
  /root/domain
  /root/scdomain
  /root/install.log
  /etc/xray/domain
  /etc/xray/ipvps
  /etc/xray/city
  /etc/xray/isp
)

for f in "${CONFIG_FILES[@]}"; do
  [ -e "$f" ] && rm -f "$f" && msg "Removed $f"
done

title "6. REMOVE SCT CRONTABS"

CRON_FILES=(
  /etc/cron.d/xp_all
  /etc/cron.d/logclean
  /etc/cron.d/limssh
  /etc/cron.d/limxry
  /etc/cron.d/daily_reboot
  /etc/cron.d/log.nginx
  /etc/cron.d/log.xray
)

for cf in "${CRON_FILES[@]}"; do
  [ -f "$cf" ] && rm -f "$cf" && msg "Removed $cf"
done

title "7. FLUSH IPTABLES"

msg "Flushing all iptables rules..."
iptables-save > /etc/iptables.rules.backup 2>/dev/null
msg "Backup saved: /etc/iptables.rules.backup"

iptables -F 2>/dev/null
iptables -t nat -F 2>/dev/null
iptables -t mangle -F 2>/dev/null
iptables -X 2>/dev/null
iptables -P INPUT ACCEPT 2>/dev/null
iptables -P FORWARD ACCEPT 2>/dev/null
iptables -P OUTPUT ACCEPT 2>/dev/null

ip6tables -F 2>/dev/null
ip6tables -t nat -F 2>/dev/null
ip6tables -t mangle -F 2>/dev/null

rm -f /etc/iptables/rules.v4 /etc/iptables/rules.v6 /etc/iptables.up.rules 2>/dev/null

which netfilter-persistent &>/dev/null && netfilter-persistent save 2>/dev/null

msg "All iptables rules flushed"

title "8. REVERT SYSCTL OPTIMIZATIONS"

[ -f /etc/sysctl.conf ] && cp /etc/sysctl.conf /etc/sysctl.conf.sct.bak

sysctl_keys=(
  "net.ipv4.tcp_rmem"
  "net.ipv4.tcp_wmem"
  "net.ipv4.tcp_congestion_control"
  "net.core.default_qdisc"
  "net.ipv4.tcp_notsent_lowat"
  "net.ipv4.tcp_slow_start_after_idle"
  "net.ipv4.tcp_mtu_probing"
  "net.ipv4.ip_forward"
  "net.ipv6.conf.all.forwarding"
  "net.ipv6.conf.all.disable_ipv6"
  "net.ipv4.conf.all.rp_filter"
  "net.ipv4.conf.all.accept_source_route"
  "net.ipv4.tcp_syncookies"
  "net.ipv4.tcp_fin_timeout"
  "net.ipv4.tcp_tw_reuse"
  "net.ipv4.tcp_max_syn_backlog"
  "net.core.somaxconn"
  "net.core.netdev_max_backlog"
  "net.ipv4.tcp_fastopen"
  "net.ipv4.tcp_mem"
  "net.ipv4.udp_mem"
  "net.ipv4.ip_local_port_range"
  "fs.file-max"
)

for key in "${sysctl_keys[@]}"; do
  sed -i "/^$key\s*=/d" /etc/sysctl.conf 2>/dev/null
done
msg "Reverted sysctl.conf (backup: /etc/sysctl.conf.sct.bak)"

sed -i '/^DefaultTimeoutStopSec/d' /etc/systemd/system.conf 2>/dev/null
sed -i '/^tcp_bbr/d' /etc/modules-load.d/modules.conf 2>/dev/null
sed -i '/^\*\s*soft\s*nofile/d' /etc/security/limits.conf 2>/dev/null
sed -i '/^\*\s*hard\s*nofile/d' /etc/security/limits.conf 2>/dev/null
sed -i '/^root\s*soft\s*nofile/d' /etc/security/limits.conf 2>/dev/null
sed -i '/^root\s*hard\s*nofile/d' /etc/security/limits.conf 2>/dev/null

sysctl -p 2>/dev/null
echo 0 > /proc/sys/net/ipv6/conf/all/disable_ipv6 2>/dev/null

title "9. REMOVE SWAP"

if grep -q '/swapfile' /etc/fstab 2>/dev/null; then
  swapoff /swapfile 2>/dev/null
  sed -i '/\/swapfile/d' /etc/fstab
  rm -f /swapfile
  msg "Removed swapfile"
fi

title "10. RESTORE SSH & DROPBEAR"

if [ -f /etc/ssh/sshd_config ]; then
  sed -i '/^Port 2222/d' /etc/ssh/sshd_config 2>/dev/null
  sed -i '/^Port 2223/d' /etc/ssh/sshd_config 2>/dev/null
  sed -i '/^Banner \/etc\/banner.txt/d' /etc/ssh/sshd_config 2>/dev/null
  sed -i 's/^AcceptEnv/#AcceptEnv/' /etc/ssh/sshd_config 2>/dev/null
  systemctl restart sshd 2>/dev/null
  msg "SSH config restored (port 22 only)"
fi

systemctl stop dropbear 2>/dev/null
systemctl disable dropbear 2>/dev/null
msg "Dropbear stopped & disabled"

title "11. RESTORE ETC/SHELLS & PROFILE"

sed -i '/^\/bin\/false/d' /etc/shells 2>/dev/null
sed -i '/^\/usr\/sbin\/nologin/d' /etc/shells 2>/dev/null
sed -i '/^unset HISTFILE/d' /etc/profile 2>/dev/null

title "12. REMOVE HOME ARTIFACTS"

rm -f /home/files /home/daily_reboot 2>/dev/null

warn "Timezone currently set to Asia/Jakarta"
warn "Reset ke UTC? (default: skip)"
read -rp "Reset timezone? [y/N]: " tz_reset
[[ "$tz_reset" =~ ^[yY] ]] && timedatectl set-timezone UTC && msg "Timezone reset to UTC"

current_hostname=$(hostname)
warn "Hostname saat ini: $current_hostname"
warn "Reset ke default? (contoh: ubuntu)"
read -rp "Reset hostname? [y/N]: " hn_reset
if [[ "$hn_reset" =~ ^[yY] ]]; then
  hostnamectl set-hostname ubuntu
  sed -i "s/$current_hostname/ubuntu/g" /etc/hosts 2>/dev/null
  msg "Hostname reset to 'ubuntu'"
fi

title "13. PURGE SCT PACKAGES (OPSIONAL)"

echo -e "${YELLOW}Hapus package berikut? (Pilih dengan hati-hati)${NC}"
echo "  1) xray-core"
echo "  2) haproxy"
echo "  3) nginx"
echo "  4) dropbear"
echo "  5) openvpn + easy-rsa"
echo "  6) vnstat"
echo "  7) ALL of the above"
echo "  8) Skip package removal (default)"
echo ""
read -rp "Pilih [1-8, default 8]: " pkg_choice

case "$pkg_choice" in
  1)
    bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ remove 2>/dev/null
    msg "Xray-core removed"
    ;;
  2)
    apt-get purge -y haproxy 2>/dev/null
    msg "HAProxy purged"
    ;;
  3)
    apt-get purge -y nginx nginx-common nginx-core 2>/dev/null
    msg "Nginx purged"
    ;;
  4)
    apt-get purge -y dropbear 2>/dev/null
    msg "Dropbear purged"
    ;;
  5)
    apt-get purge -y openvpn easy-rsa 2>/dev/null
    msg "OpenVPN + easy-rsa purged"
    ;;
  6)
    apt-get purge -y vnstat 2>/dev/null
    msg "vnstat purged"
    ;;
  7)
    bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ remove 2>/dev/null
    apt-get purge -y haproxy nginx nginx-common nginx-core dropbear openvpn easy-rsa 2>/dev/null
    apt-get purge -y vnstat rclone 2>/dev/null || true
    msg "All packages removed"
    ;;
  *)
    msg "Package removal skipped"
    ;;
esac

title "14. CLEANUP"

apt-get autoremove -y 2>/dev/null
apt-get autoclean -y 2>/dev/null

echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}      SCT UNINSTALL COMPLETE                  ${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}⚠  Rekomendasi: reboot VPS sekarang${NC}"
echo -e "${YELLOW}⚠  Backup iptables: /etc/iptables.rules.backup${NC}"
echo -e "${YELLOW}⚠  Backup sysctl: /etc/sysctl.conf.sct.bak${NC}"
echo ""

read -rp "Reboot sekarang? [y/N]: " reboot_now
[[ "$reboot_now" =~ ^[yY] ]] && reboot

exit 0

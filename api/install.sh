#!/bin/bash
# SCT API Server Installer (Node.js)
# Usage: bash install.sh

API_DIR="/usr/local/api-server"
API_PORT="${API_PORT:-5000}"

echo "[+] Installing Node.js if needed..."
if ! command -v node &>/dev/null; then
  apt update -y
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

echo "[+] Copying files to $API_DIR..."
mkdir -p "$API_DIR" "$API_DIR/controllers" "$API_DIR/models" "$API_DIR/routes" "$API_DIR/middleware" "$API_DIR/utils"
cp server.js auth.js package.json "$API_DIR/"
cp controllers/*.js "$API_DIR/controllers/"
cp models/*.js "$API_DIR/models/"
cp routes/*.js "$API_DIR/routes/"
cp middleware/*.js "$API_DIR/middleware/"
cp utils/*.js "$API_DIR/utils/"
cd "$API_DIR" && npm install --production

echo "[+] Creating IP whitelist..."
MYIP=$(curl -s ipv4.icanhazip.com)
cat > /etc/xray/api-whitelist.conf << EOF
# SCT API Server — IP Whitelist
# Satu IP per baris. Baris diawali # akan diabaikan.
# Gunakan 0.0.0.0 untuk mengizinkan semua IP.

::1
$MYIP
EOF
echo "[+] Whitelist: /etc/xray/api-whitelist.conf ($MYIP, ::1)"

echo "[+] Creating systemd service..."
cat > /etc/systemd/system/api-server.service << 'SERVICE'
[Unit]
Description=SCT API Server (Node.js)
After=network.target xray.service

[Service]
Type=simple
User=root
WorkingDirectory=/usr/local/api-server
ExecStart=/usr/bin/node /usr/local/api-server/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=API_PORT=5000
Environment=API_HOST=127.0.0.1

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable api-server
systemctl start api-server

echo ""
echo "========================================="
echo " SCT API Server installed!"
echo "========================================="
echo " Listen : http://127.0.0.1:5000"
echo ""
echo " Cek health:"
echo "   curl http://127.0.0.1:5000/api/health"
echo ""
echo " Cek IP sendiri:"
echo "   curl http://127.0.0.1:5000/api/auth/myip"
echo ""
echo " Tambah IP whitelist:"
echo "   curl -X POST -H 'Content-Type: application/json' \\"
echo "     -d '{\"ip\":\"YOUR_IP\"}' \\"
echo "     http://127.0.0.1:5000/api/auth/whitelist"
echo ""
echo " Whitelist : /etc/xray/api-whitelist.conf"
echo " Service   : systemctl status api-server"
echo " Logs      : journalctl -u api-server -f"
echo "========================================="

#!/usr/bin/env node
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const mountRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.API_PORT || 5000;
const HOST = process.env.API_HOST || '127.0.0.1';

app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(morgan('short'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

mountRoutes(app);
app.use(errorHandler);

console.log(`[+] SCT API Server: http://${HOST}:${PORT}`);
console.log(`[+] Auth: IP Whitelist (/etc/xray/api-whitelist.conf)`);
console.log(`[+] Cek IP sendiri: GET /api/auth/myip`);

app.listen(PORT, HOST, () => {
  console.log(`[+] Server running on ${HOST}:${PORT}`);
});

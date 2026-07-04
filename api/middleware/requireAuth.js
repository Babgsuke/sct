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

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || '';
}

function requireAuth(req, res, next) {
  const clientIp = getClientIp(req);
  const whitelist = loadWhitelist();

  if (whitelist.includes(clientIp) || whitelist.includes('0.0.0.0')) {
    req.clientIp = clientIp;
    return next();
  }

  return res.status(401).json({
    error: `IP ${clientIp} tidak terdaftar di whitelist`,
    whitelist_path: WHITELIST_FILE,
  });
}

module.exports = requireAuth;

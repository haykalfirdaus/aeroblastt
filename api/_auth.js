import crypto from 'crypto';

export function getSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('Missing ADMIN_SECRET env var (see .env.local / Vercel env).');
  }
  return secret;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  const secret = getSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (!parsed.adminId || !parsed.iat) return false;
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.iat > maxAge) return false;
    return true;
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((part) => {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) return;
    const key = part.slice(0, eqIdx).trim();
    const value = part.slice(eqIdx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

export function isAuthenticated(req) {
  const cookies = parseCookies(req.headers['cookie']);
  return verifyToken(cookies['aeroblast_admin_session']);
}

export function setCorsHeaders(req, res, methods = 'GET, OPTIONS') {
  const origin = req.headers['origin'];
  const allowed = process.env.ALLOWED_ORIGIN || 'https://store.aeroblast.my.id';
  if (origin === allowed || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || allowed);
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
}

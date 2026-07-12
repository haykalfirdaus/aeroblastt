import crypto from 'crypto';
import { getClientIp, isRateLimited, recordFailedAttempt, clearAttempts, remainingMs } from '../_ratelimit.js';

function getSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('Missing ADMIN_SECRET env var');
  return secret;
}

function getAdminUsername() {
  const username = process.env.ADMIN_USERNAME;
  if (!username) throw new Error('Missing ADMIN_USERNAME env var');
  return username;
}

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Missing ADMIN_PASSWORD env var');
  return password;
}

function timingSafeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function createToken(adminId) {
  const secret = getSecret();
  const payload = Buffer.from(JSON.stringify({ adminId, iat: Date.now() })).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function setCorsHeaders(req, res) {
  const origin = req.headers['origin'];
  const allowed = process.env.ALLOWED_ORIGIN || 'https://store.aeroblast.my.id';
  if (origin === allowed || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || allowed);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    const retryAfterSec = Math.ceil(remainingMs(ip) / 1000);
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      ok: false,
      error: 'Terlalu banyak percobaan login. Coba lagi dalam 10 menit.',
      retryAfterMs: remainingMs(ip),
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
  }

  const { username, password } = body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ ok: false, error: 'Missing credentials' });
    return;
  }

  const usernameMatch = timingSafeCompare(username, getAdminUsername());
  const passwordMatch = timingSafeCompare(password, getAdminPassword());

  if (!usernameMatch || !passwordMatch) {
    recordFailedAttempt(ip);
    res.status(401).json({ ok: false, error: 'Username atau password salah' });
    return;
  }

  clearAttempts(ip);

  const token = createToken('admin');
  const cookieMaxAge = 60 * 60 * 24 * 7;
  const isProduction = process.env.NODE_ENV !== 'development';

  res.setHeader(
    'Set-Cookie',
    `aeroblast_admin_session=${token}; HttpOnly; Path=/; Max-Age=${cookieMaxAge}; SameSite=Strict${isProduction ? '; Secure' : ''}`
  );

  res.status(200).json({ ok: true });
}

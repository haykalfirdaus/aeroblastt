import crypto from 'crypto';
import { setCorsHeaders } from '../_auth.js';

function getSecret() {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error('Missing ADMIN_SECRET env var');
  return s;
}

// Rate limiter: max 5 attempts per 15 minutes per IP
const attempts = new Map();
const MAX = 5;
const WINDOW_MS = 15 * 60 * 1000;
const OTP_TTL = 5 * 60 * 1000;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= MAX) return true;
  entry.count++;
  return false;
}

function verifyOtpToken(token, submittedOtp) {
  if (!token || !submittedOtp) return false;
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

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return false;
  }

  if (!parsed.otp || !parsed.iat) return false;
  if (Date.now() - parsed.iat > OTP_TTL) return false;

  // Timing-safe compare OTP
  const otpBuf = Buffer.from(String(parsed.otp));
  const submitBuf = Buffer.from(String(submittedOtp).trim());
  if (otpBuf.length !== submitBuf.length) return false;
  return crypto.timingSafeEqual(otpBuf, submitBuf);
}

function createSessionToken(secret) {
  const payload = Buffer.from(JSON.stringify({ adminId: 'admin', iat: Date.now() })).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { res.status(400).json({ ok: false, error: 'Invalid JSON' }); return; }
  }

  const { token, otp } = body || {};

  if (!token || !otp) {
    res.status(400).json({ ok: false, error: 'token dan otp diperlukan' });
    return;
  }

  let secret;
  try { secret = getSecret(); } catch {
    res.status(500).json({ ok: false, error: 'Server misconfigured' });
    return;
  }

  if (!verifyOtpToken(token, otp)) {
    res.status(401).json({ ok: false, error: 'Kode tidak valid atau sudah kedaluwarsa' });
    return;
  }

  // Issue session cookie — same format as login.js
  const sessionToken = createSessionToken(secret);
  const cookieMaxAge = 60 * 60 * 24 * 7;
  const isProduction = process.env.NODE_ENV !== 'development';

  res.setHeader(
    'Set-Cookie',
    `aeroblast_admin_session=${sessionToken}; HttpOnly; Path=/; Max-Age=${cookieMaxAge}; SameSite=Strict${isProduction ? '; Secure' : ''}`
  );

  res.status(200).json({ ok: true });
}

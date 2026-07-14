import crypto from 'crypto';
import { setCorsHeaders, getSecret } from '../_auth.js';
import { getClientIp, clearAttempts } from '../_ratelimit.js';

// Rate limiter: max 5 OTP attempts per 15 minutes per IP
const otpAttempts = new Map();
const MAX = 5;
const WINDOW_MS = 15 * 60 * 1000;
const OTP_TTL = 5 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = otpAttempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    otpAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= MAX) return true;
  entry.count++;
  return false;
}

function verifyOtpToken(token, submittedOtp, secret) {
  if (!token || !submittedOtp) return false;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

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

  const otpBuf = Buffer.from(String(parsed.otp));
  const submitBuf = Buffer.from(String(submittedOtp).trim());
  if (otpBuf.length !== submitBuf.length) return false;
  return crypto.timingSafeEqual(otpBuf, submitBuf);
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

  if (!verifyOtpToken(token, otp, secret)) {
    res.status(401).json({ ok: false, error: 'Kode tidak valid atau sudah kedaluwarsa' });
    return;
  }

  // OTP valid — reset login rate limit for this IP so admin can try password again
  clearAttempts(ip);

  res.status(200).json({ ok: true });
}

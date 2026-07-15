// POST /api/admin/otp?action=send    — kirim OTP ke email admin
// POST /api/admin/otp?action=verify  — verifikasi OTP, grant session

import crypto from 'crypto';
import { setCorsHeaders, getSecret } from '../_auth.js';
import { getClientIp, clearAttempts } from '../_ratelimit.js';

// ── SEND rate limiter ─────────────────────────────────────────────────────────
const sendAttempts = new Map();
const SEND_MAX = 3;
const SEND_WINDOW = 15 * 60 * 1000;

function isSendLimited(ip) {
  const now = Date.now();
  const e = sendAttempts.get(ip);
  if (!e || now - e.windowStart > SEND_WINDOW) {
    sendAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (e.count >= SEND_MAX) return true;
  e.count++;
  return false;
}

// ── VERIFY rate limiter ───────────────────────────────────────────────────────
const verifyAttempts = new Map();
const VERIFY_MAX = 5;
const VERIFY_WINDOW = 15 * 60 * 1000;
const OTP_TTL = 5 * 60 * 1000;

function isVerifyLimited(ip) {
  const now = Date.now();
  const e = verifyAttempts.get(ip);
  if (!e || now - e.windowStart > VERIFY_WINDOW) {
    verifyAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (e.count >= VERIFY_MAX) return true;
  e.count++;
  return false;
}

// ── OTP token helpers ─────────────────────────────────────────────────────────
function buildOtpToken(otp, secret) {
  const payload = Buffer.from(JSON.stringify({ otp, iat: Date.now() })).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyOtpToken(token, submittedOtp, secret) {
  if (!token || !submittedOtp) return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  let parsed;
  try { parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')); } catch { return false; }
  if (!parsed.otp || !parsed.iat) return false;
  if (Date.now() - parsed.iat > OTP_TTL) return false;
  const otpBuf = Buffer.from(String(parsed.otp));
  const subBuf = Buffer.from(String(submittedOtp).trim());
  if (otpBuf.length !== subBuf.length) return false;
  return crypto.timingSafeEqual(otpBuf, subBuf);
}

function createAdminToken(secret) {
  const payload = Buffer.from(JSON.stringify({ adminId: 'admin', iat: Date.now() })).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

// ── Email HTML ────────────────────────────────────────────────────────────────
function emailHtml(otp) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030711;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030711;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#0d1526;border:1px solid rgba(59,130,246,0.2);border-radius:16px;overflow:hidden">
        <tr>
          <td style="background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(34,211,238,0.08));padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06)">
            <h1 style="margin:0;color:#f0f4ff;font-size:20px;font-weight:700">AeroBlast Admin</h1>
            <p style="margin:6px 0 0;color:#6b7a99;font-size:13px">Kode Verifikasi Login</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center">
            <p style="margin:0 0 24px;color:#9aa3b8;font-size:14px;line-height:1.6">
              Kode berlaku selama <strong style="color:#f0f4ff">5 menit</strong>.
            </p>
            <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:12px;padding:24px 32px;display:inline-block;margin-bottom:24px">
              <span style="font-family:monospace;font-size:40px;font-weight:800;letter-spacing:12px;color:#60a5fa">${otp}</span>
            </div>
            <p style="margin:0;color:#4b5570;font-size:12px">Jangan bagikan kode ini kepada siapapun.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center">
            <p style="margin:0;color:#3a4255;font-size:11px">AeroBlast Network &copy; 2025</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── SEND handler ──────────────────────────────────────────────────────────────
async function handleSend(req, res) {
  const ip = getClientIp(req);
  if (isSendLimited(ip))
    return res.status(429).json({ ok: false, error: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' });

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!resendKey || !adminEmail)
    return res.status(500).json({ ok: false, error: 'Server misconfigured' });

  let secret;
  try { secret = getSecret(); } catch {
    return res.status(500).json({ ok: false, error: 'Server misconfigured' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const token = buildOtpToken(otp, secret);

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'AeroBlast Admin <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `Kode Verifikasi Login AeroBlast — ${otp}`,
        html: emailHtml(otp),
      }),
    });
    if (!emailRes.ok) throw new Error(`Resend HTTP ${emailRes.status}`);
  } catch {
    return res.status(502).json({ ok: false, error: 'Gagal mengirim kode. Coba lagi.' });
  }

  return res.status(200).json({ ok: true, token });
}

// ── VERIFY handler ────────────────────────────────────────────────────────────
async function handleVerify(req, res) {
  const ip = getClientIp(req);
  if (isVerifyLimited(ip))
    return res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  const { token, otp } = body || {};
  if (!token || !otp)
    return res.status(400).json({ ok: false, error: 'token dan otp diperlukan' });

  let secret;
  try { secret = getSecret(); } catch {
    return res.status(500).json({ ok: false, error: 'Server misconfigured' });
  }

  if (!verifyOtpToken(token, otp, secret))
    return res.status(401).json({ ok: false, error: 'Kode tidak valid atau sudah kedaluwarsa' });

  clearAttempts(ip);

  const adminToken = createAdminToken(secret);
  const isProduction = process.env.NODE_ENV !== 'development';
  res.setHeader(
    'Set-Cookie',
    `aeroblast_admin_session=${adminToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict${isProduction ? '; Secure' : ''}`
  );

  return res.status(200).json({ ok: true, sessionGranted: true });
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { action } = req.query;
  if (action === 'send') return handleSend(req, res);
  if (action === 'verify') return handleVerify(req, res);
  return res.status(400).json({ ok: false, error: 'action tidak valid' });
}

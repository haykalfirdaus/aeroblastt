import crypto from 'crypto';
import { setCorsHeaders } from '../_auth.js';

function getSecret() {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error('Missing ADMIN_SECRET env var');
  return s;
}

function getResendKey() {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error('Missing RESEND_API_KEY env var');
  return k;
}

function getAdminEmail() {
  const e = process.env.ADMIN_EMAIL;
  if (!e) throw new Error('Missing ADMIN_EMAIL env var');
  return e;
}

// Rate limiter: max 3 requests per 15 minutes per IP
const attempts = new Map();
const MAX = 3;
const WINDOW_MS = 15 * 60 * 1000;

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

function buildToken(otp) {
  const payload = Buffer.from(JSON.stringify({ otp, iat: Date.now() })).toString('base64');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

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
            <div style="width:56px;height:56px;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
              <span style="font-size:28px">🛡️</span>
            </div>
            <h1 style="margin:0;color:#f0f4ff;font-size:20px;font-weight:700">AeroBlast Admin</h1>
            <p style="margin:6px 0 0;color:#6b7a99;font-size:13px">Kode Verifikasi Login</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center">
            <p style="margin:0 0 24px;color:#9aa3b8;font-size:14px;line-height:1.6">
              Gunakan kode di bawah untuk masuk ke panel admin.<br>Kode berlaku selama <strong style="color:#f0f4ff">5 menit</strong>.
            </p>
            <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:12px;padding:24px 32px;display:inline-block;margin-bottom:24px">
              <span style="font-family:monospace;font-size:40px;font-weight:800;letter-spacing:12px;color:#60a5fa">${otp}</span>
            </div>
            <p style="margin:0;color:#4b5570;font-size:12px">
              Jangan bagikan kode ini kepada siapapun.<br>
              Jika kamu tidak meminta kode ini, abaikan email ini.
            </p>
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

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' });
    return;
  }

  let resendKey, adminEmail;
  try {
    resendKey = getResendKey();
    adminEmail = getAdminEmail();
    getSecret(); // validate early
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server misconfigured' });
    return;
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const token = buildToken(otp);

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'AeroBlast Admin <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `Kode Verifikasi Login AeroBlast — ${otp}`,
        html: emailHtml(otp),
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json().catch(() => ({}));
      throw new Error(err.message || `Resend HTTP ${emailRes.status}`);
    }
  } catch (err) {
    res.status(502).json({ ok: false, error: 'Gagal mengirim kode. Coba lagi.' });
    return;
  }

  // Return token ke client — OTP hanya ada di email, tidak di response
  res.status(200).json({ ok: true, token });
}

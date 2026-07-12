import crypto from 'crypto';
import { setCorsHeaders, getSecret } from '../_auth.js';

function getResendKey() {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error('Missing RESEND_API_KEY env var');
  return k;
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

function createSessionToken(secret) {
  const payload = Buffer.from(JSON.stringify({ adminId: 'admin', iat: Date.now() })).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function credentialsEmailHtml(username, password) {
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
              <span style="font-size:28px">🔑</span>
            </div>
            <h1 style="margin:0;color:#f0f4ff;font-size:20px;font-weight:700">AeroBlast Admin</h1>
            <p style="margin:6px 0 0;color:#6b7a99;font-size:13px">Informasi Kredensial Login</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 20px;color:#9aa3b8;font-size:14px;line-height:1.6">
              Verifikasi identitasmu berhasil. Berikut kredensial login panel admin:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:12px;overflow:hidden;margin-bottom:24px">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05)">
                  <p style="margin:0 0 4px;color:#4b5570;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Username</p>
                  <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#60a5fa;letter-spacing:2px">${username}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px">
                  <p style="margin:0 0 4px;color:#4b5570;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Password</p>
                  <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#60a5fa;letter-spacing:2px">${password}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#4b5570;font-size:12px;line-height:1.6">
              Kamu sudah otomatis masuk ke panel admin.<br>
              Jangan bagikan informasi ini kepada siapapun.
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

  // OTP valid — ambil kredensial dari env
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!username || !password || !adminEmail) {
    res.status(500).json({ ok: false, error: 'Server misconfigured' });
    return;
  }

  // Kirim email kredensial (non-blocking jika gagal — admin tetap masuk)
  try {
    const resendKey = getResendKey();
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'AeroBlast Admin <onboarding@resend.dev>',
        to: [adminEmail],
        subject: 'Kredensial Login Panel Admin AeroBlast',
        html: credentialsEmailHtml(username, password),
      }),
    });
  } catch {
    // Email gagal → tetap lanjut issue session
  }

  // Issue session cookie — bypass rate limit login yang mungkin aktif
  const sessionToken = createSessionToken(secret);
  const cookieMaxAge = 60 * 60 * 24 * 7;
  const isProduction = process.env.NODE_ENV !== 'development';

  res.setHeader(
    'Set-Cookie',
    `aeroblast_admin_session=${sessionToken}; HttpOnly; Path=/; Max-Age=${cookieMaxAge}; SameSite=Strict${isProduction ? '; Secure' : ''}`
  );

  res.status(200).json({ ok: true });
}

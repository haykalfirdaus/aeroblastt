import { setCorsHeaders, signPlayerToken, verifyPlayerToken } from './_auth.js';
import { isRegisteredInAuthme } from './_mysql.js';

const NICK_RE = /^[a-zA-Z0-9_.]{1,30}$/;
const isProd = process.env.NODE_ENV !== 'development';

const requests = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.windowStart > 60_000) {
    requests.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

function getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return fwd ? fwd.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // GET /api/player — verify session
  if (req.method === 'GET') {
    const nick = verifyPlayerToken(req);
    res.status(200).json(nick ? { ok: true, nick } : { ok: false });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON' }); return;
    }
  }

  const action = body?.action;

  // POST /api/player { action: 'logout' } — clear session
  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'aeroblast_player_session=; Path=/; Max-Age=0; SameSite=Strict; HttpOnly');
    res.status(200).json({ ok: true });
    return;
  }

  // POST /api/player { action: 'login', nick } — verify via NLogin RCON, set cookie
  if (action === 'login') {
    if (isRateLimited(getIp(req))) {
      res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' });
      return;
    }

    const nick = (body?.nick || '').trim();
    if (!NICK_RE.test(nick)) {
      res.status(400).json({ ok: false, error: 'Username tidak valid (1-16 karakter, hanya huruf/angka/underscore)' });
      return;
    }

    let registered;
    try {
      registered = await isRegisteredInAuthme(nick);
    } catch (err) {
      console.error('[player/login] MySQL error:', err.message);
      res.status(503).json({ ok: false, error: 'Tidak bisa terhubung ke database. Coba lagi nanti.' });
      return;
    }
    if (!registered) {
      res.status(404).json({ ok: false, error: `Username "${nick}" tidak ditemukan di server. Pastikan kamu sudah pernah join server AeroBlast.` });
      return;
    }

    const token = signPlayerToken(nick);
    const cookieFlags = [
      `aeroblast_player_session=${encodeURIComponent(token)}`,
      'Path=/',
      'Max-Age=86400',
      'SameSite=Strict',
      'HttpOnly',
      isProd ? 'Secure' : '',
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieFlags);
    res.status(200).json({ ok: true, nick });
    return;
  }

  res.status(400).json({ ok: false, error: 'action tidak valid. Pilih: login, logout' });
}

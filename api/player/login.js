import { setCorsHeaders, signPlayerToken } from '../_auth.js';
import { verifyPlayer } from '../_rcon.js';

const NICK_RE = /^[a-zA-Z0-9_]{1,16}$/;

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

const isProd = process.env.NODE_ENV !== 'development';

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

  if (isRateLimited(getIp(req))) {
    res.status(429).json({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON' }); return;
    }
  }

  const nick = (body?.nick || '').trim();
  if (!NICK_RE.test(nick)) {
    res.status(400).json({ ok: false, error: 'Username tidak valid (1-16 karakter, hanya huruf/angka/underscore)' });
    return;
  }

  const result = await verifyPlayer(nick);

  if (!result.ok) {
    res.status(503).json({ ok: false, error: 'Tidak bisa terhubung ke server Minecraft. Coba lagi nanti.' });
    return;
  }

  if (!result.registered) {
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
}

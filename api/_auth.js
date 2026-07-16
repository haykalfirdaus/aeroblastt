import crypto from 'crypto';
import { supabaseAuth } from './_supabase.js';

// ── Cookie helper ─────────────────────────────────────────────────────────────

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((part) => {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) return;
    cookies[part.slice(0, eqIdx).trim()] = decodeURIComponent(part.slice(eqIdx + 1).trim());
  });
  return cookies;
}

// ── Admin auth — Supabase JWT verified server-side ────────────────────────────

export async function isAuthenticated(req) {
  const cookies = parseCookies(req.headers['cookie']);
  const token = cookies['aeroblast_admin_session'];
  if (!token) return false;
  if (!supabaseAuth) return false;
  const { data, error } = await supabaseAuth.auth.getUser(token);
  return !error && !!data?.user;
}

// ── Player session (24h, cookie: aeroblast_player_session) ───────────────────
// Kept as custom HMAC — players are not Supabase Auth users.

function getPlayerSecret() {
  const secret = process.env.ADMIN_SECRET || process.env.PLAYER_SECRET;
  if (!secret) throw new Error('Missing ADMIN_SECRET / PLAYER_SECRET env var');
  return secret;
}

export function signPlayerToken(nick) {
  const secret = getPlayerSecret();
  const payload = Buffer.from(JSON.stringify({ nick, iat: Date.now() })).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyPlayerToken(req) {
  const cookies = parseCookies(req.headers['cookie']);
  const token = cookies['aeroblast_player_session'];
  if (!token || typeof token !== 'string') return null;

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  let secret;
  try { secret = getPlayerSecret(); } catch { return null; }

  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (!parsed.nick || !parsed.iat) return null;
    if (Date.now() - parsed.iat > 24 * 60 * 60 * 1000) return null;
    return parsed.nick;
  } catch {
    return null;
  }
}

// ── CORS ──────────────────────────────────────────────────────────────────────

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

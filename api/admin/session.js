// GET    /api/admin/session — verifikasi session dari cookie
// POST   /api/admin/session — terima access_token, set HttpOnly cookie
// DELETE /api/admin/session — hapus cookie (logout)

import { setCorsHeaders, parseCookies } from '../_auth.js';
import { supabaseAuth } from '../_supabase.js';

const COOKIE_NAME = 'aeroblast_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function setCookie(res, value, maxAge) {
  const isProduction = process.env.NODE_ENV !== 'development';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${isProduction ? '; Secure' : ''}`
  );
}

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── GET — cek apakah cookie valid ──────────────────────────────────────────
  if (req.method === 'GET') {
    const cookies = parseCookies(req.headers['cookie']);
    const token = cookies[COOKIE_NAME];
    if (!token || !supabaseAuth) return res.status(200).json({ authenticated: false });

    const { data, error } = await supabaseAuth.auth.getUser(token);
    return res.status(200).json({ authenticated: !error && !!data?.user });
  }

  // ── POST — tukar access_token → HttpOnly cookie ────────────────────────────
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {
        return res.status(400).json({ ok: false, error: 'Invalid JSON' });
      }
    }

    const { access_token } = body || {};
    if (!access_token || typeof access_token !== 'string')
      return res.status(400).json({ ok: false, error: 'access_token diperlukan' });

    if (!supabaseAuth)
      return res.status(500).json({ ok: false, error: 'SUPABASE_ANON_KEY tidak dikonfigurasi' });

    const { data, error } = await supabaseAuth.auth.getUser(access_token);
    if (error || !data?.user)
      return res.status(401).json({ ok: false, error: 'Token tidak valid' });

    setCookie(res, access_token, COOKIE_MAX_AGE);
    return res.status(200).json({ ok: true });
  }

  // ── DELETE — logout, hapus cookie ─────────────────────────────────────────
  if (req.method === 'DELETE') {
    setCookie(res, '', 0);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

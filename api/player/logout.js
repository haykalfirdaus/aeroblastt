import { setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false }); return; }

  res.setHeader('Set-Cookie', 'aeroblast_player_session=; Path=/; Max-Age=0; SameSite=Strict; HttpOnly');
  res.status(200).json({ ok: true });
}

import { setCorsHeaders, verifyPlayerToken } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ ok: false }); return; }

  const nick = verifyPlayerToken(req);
  if (nick) {
    res.status(200).json({ ok: true, nick });
  } else {
    res.status(200).json({ ok: false });
  }
}

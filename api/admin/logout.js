import { setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const isProduction = process.env.NODE_ENV !== 'development';
  res.setHeader(
    'Set-Cookie',
    `aeroblast_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isProduction ? '; Secure' : ''}`
  );

  res.status(200).json({ ok: true });
}

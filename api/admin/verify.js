import { isAuthenticated, setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ authenticated: false, error: 'Method not allowed' });
    return;
  }

  if (isAuthenticated(req)) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(200).json({ authenticated: false });
  }
}

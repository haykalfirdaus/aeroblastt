import { isAuthenticated, setCorsHeaders } from '../_auth.js';
import { grantRank, giveMoney, giveSkill } from '../_rcon.js';

const VALID_ACTIONS = ['rank', 'money', 'skill'];

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON' });
      return;
    }
  }

  const { action, nick } = body || {};

  if (!VALID_ACTIONS.includes(action)) {
    res.status(400).json({ ok: false, error: `action tidak valid. Pilih: ${VALID_ACTIONS.join(', ')}` });
    return;
  }
  if (!nick || typeof nick !== 'string' || !nick.trim()) {
    res.status(400).json({ ok: false, error: 'nick diperlukan' });
    return;
  }

  let result;

  if (action === 'rank') {
    const { rankKey, duration } = body;
    if (!rankKey) {
      res.status(400).json({ ok: false, error: 'rankKey diperlukan' });
      return;
    }
    result = await grantRank(nick.trim(), rankKey, duration ?? 'permanent');
  } else if (action === 'money') {
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      res.status(400).json({ ok: false, error: 'amount harus angka positif' });
      return;
    }
    result = await giveMoney(nick.trim(), amount);
  } else if (action === 'skill') {
    const { skillName } = body;
    const levels = Number(body.levels);
    if (!skillName) {
      res.status(400).json({ ok: false, error: 'skillName diperlukan' });
      return;
    }
    if (!levels || levels <= 0) {
      res.status(400).json({ ok: false, error: 'levels harus angka positif' });
      return;
    }
    result = await giveSkill(nick.trim(), skillName, levels);
  }

  res.status(result.ok ? 200 : 502).json(result);
}

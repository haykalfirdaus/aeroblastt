import { isAuthenticated, setCorsHeaders } from '../_auth.js';
import { grantRank, giveMoney, giveKey, giveBansos, bansosCancel, bansosList, eventAdd, eventClear, eventTime, KEY_NAMES } from '../_rcon.js';

const VALID_ACTIONS = ['rank', 'money', 'key', 'bansos', 'event'];

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (!isAuthenticated(req)) { res.status(401).json({ ok: false, error: 'Unauthorized' }); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON' }); return;
    }
  }

  const { action } = body || {};

  if (!VALID_ACTIONS.includes(action)) {
    res.status(400).json({ ok: false, error: `action tidak valid. Pilih: ${VALID_ACTIONS.join(', ')}` });
    return;
  }

  let result;

  if (action === 'rank') {
    const { nick, rankKey, duration } = body;
    if (!nick?.trim()) { res.status(400).json({ ok: false, error: 'nick diperlukan' }); return; }
    if (!rankKey) { res.status(400).json({ ok: false, error: 'rankKey diperlukan' }); return; }
    result = await grantRank(nick.trim(), rankKey, duration ?? 'permanent');

  } else if (action === 'money') {
    const { nick } = body;
    const amount = Number(body.amount);
    if (!nick?.trim()) { res.status(400).json({ ok: false, error: 'nick diperlukan' }); return; }
    if (!amount || amount <= 0) { res.status(400).json({ ok: false, error: 'amount harus angka positif' }); return; }
    result = await giveMoney(nick.trim(), amount);

  } else if (action === 'key') {
    const { nick, keyName } = body;
    const qty = Number(body.qty);
    if (!nick?.trim()) { res.status(400).json({ ok: false, error: 'nick diperlukan' }); return; }
    if (!keyName || !KEY_NAMES.includes(keyName)) {
      res.status(400).json({ ok: false, error: `keyName tidak valid. Pilih: ${KEY_NAMES.join(', ')}` }); return;
    }
    if (!qty || qty <= 0) { res.status(400).json({ ok: false, error: 'qty harus angka positif' }); return; }
    result = await giveKey(nick.trim(), keyName, qty);

  } else if (action === 'bansos') {
    const { subAction, keyName } = body;

    if (subAction === 'list') {
      result = await bansosList();
    } else if (subAction === 'cancel') {
      const { bansosId } = body;
      if (!bansosId) { res.status(400).json({ ok: false, error: 'bansosId diperlukan' }); return; }
      result = await bansosCancel(bansosId);
    } else {
      // give bansos
      if (!keyName || !KEY_NAMES.includes(keyName)) {
        res.status(400).json({ ok: false, error: `keyName tidak valid. Pilih: ${KEY_NAMES.join(', ')}` }); return;
      }
      const amount = Number(body.amount);
      if (!amount || amount <= 0) { res.status(400).json({ ok: false, error: 'amount harus angka positif' }); return; }
      result = await giveBansos(keyName, amount, body.duration?.trim() || null);
    }

  } else if (action === 'event') {
    const { subAction } = body;

    if (subAction === 'add') {
      const { name, startTime, duration } = body;
      if (!name?.trim()) { res.status(400).json({ ok: false, error: 'name diperlukan' }); return; }
      if (!startTime?.trim()) { res.status(400).json({ ok: false, error: 'startTime diperlukan' }); return; }
      if (!duration?.trim()) { res.status(400).json({ ok: false, error: 'duration diperlukan' }); return; }
      result = await eventAdd(name.trim(), startTime.trim(), duration.trim());

    } else if (subAction === 'clear') {
      const { target } = body;
      if (!target?.trim()) { res.status(400).json({ ok: false, error: 'target (id/nama event) diperlukan' }); return; }
      result = await eventClear(target.trim());

    } else if (subAction === 'time') {
      const { timeAction, target, time } = body;
      if (!['add', 'reduce'].includes(timeAction)) {
        res.status(400).json({ ok: false, error: 'timeAction harus add atau reduce' }); return;
      }
      if (!target?.trim()) { res.status(400).json({ ok: false, error: 'target diperlukan' }); return; }
      if (!time?.trim()) { res.status(400).json({ ok: false, error: 'time diperlukan (contoh: 10, 1h)' }); return; }
      result = await eventTime(timeAction, target.trim(), time.trim());

    } else {
      res.status(400).json({ ok: false, error: 'subAction event tidak valid. Pilih: add, clear, time' }); return;
    }
  }

  res.status(result.ok ? 200 : 502).json(result);
}

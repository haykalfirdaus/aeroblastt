// Satu handler untuk semua beta-payment routes
// POST /api/beta-payment?action=create   — buat order baru
// POST /api/beta-payment?action=notify   — notif dari MacroDroid
// GET  /api/beta-payment?action=status&orderId=xxx — cek status

import { setCorsHeaders } from './_auth.js';
import { supabase } from './_supabase.js';
import { grantRank, giveKey, giveMoney } from './_rcon.js';

const SUFFIX_MIN = 1001;
const SUFFIX_MAX = 2000;
const ORDER_TTL_MS = 30 * 60 * 1000;
const VALID_TYPES = ['rank', 'key', 'skill', 'balance', 'command', 'cosmetic'];
const NOTIFY_SECRET = process.env.NOTIFY_SECRET;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscord(msg) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg }),
    });
  } catch { /* non-fatal */ }
}

async function expireOldOrders() {
  await supabase
    .from('beta_orders')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());
}

async function allocateSuffix() {
  const { data: pending } = await supabase
    .from('beta_orders')
    .select('suffix')
    .eq('status', 'pending');
  const used = new Set((pending || []).map((r) => r.suffix));
  for (let s = SUFFIX_MIN; s <= SUFFIX_MAX; s++) {
    if (!used.has(s)) return s;
  }
  return null;
}

async function executeRcon(order) {
  const { type, nick, details } = order;
  if (type === 'rank') return grantRank(nick, details.target, details.duration);
  if (type === 'key') return giveKey(nick, details.keyName, details.qty ?? 1);
  if (type === 'balance') return giveMoney(nick, details.balance);
  return { ok: false, error: `Tipe '${type}' belum di-handle RCON otomatis` };
}

// ── CREATE ────────────────────────────────────────────────────────────────────
async function handleCreate(req, res) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  const { type, nick, platform, baseAmount, details } = body || {};

  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ ok: false, error: 'type tidak valid' });
  if (!nick || typeof nick !== 'string' || !nick.trim())
    return res.status(400).json({ ok: false, error: 'nick diperlukan' });
  if (!platform || typeof platform !== 'string')
    return res.status(400).json({ ok: false, error: 'platform diperlukan' });
  if (!baseAmount || typeof baseAmount !== 'number' || baseAmount <= 0)
    return res.status(400).json({ ok: false, error: 'baseAmount tidak valid' });

  await expireOldOrders();

  const suffix = await allocateSuffix();
  if (suffix === null)
    return res.status(503).json({ ok: false, error: 'Server sibuk, coba lagi nanti' });

  const totalAmount = baseAmount + suffix;
  const expiresAt = new Date(Date.now() + ORDER_TTL_MS).toISOString();

  const { data: order, error } = await supabase
    .from('beta_orders')
    .insert({
      suffix, nick: nick.trim(), platform, type,
      base_amount: baseAmount, total_amount: totalAmount,
      details: details || {}, expires_at: expiresAt,
    })
    .select('id, suffix, total_amount, expires_at')
    .single();

  if (error) return res.status(500).json({ ok: false, error: 'Gagal membuat order' });

  return res.status(200).json({
    ok: true,
    orderId: order.id,
    suffix: order.suffix,
    totalAmount: order.total_amount,
    expiresAt: order.expires_at,
  });
}

// ── NOTIFY ────────────────────────────────────────────────────────────────────
async function handleNotify(req, res) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  const { text, secret } = body || {};

  if (!NOTIFY_SECRET || secret !== NOTIFY_SECRET)
    return res.status(401).json({ ok: false, error: 'Unauthorized' });

  if (!text || typeof text !== 'string' || !text.trim())
    return res.status(400).json({ ok: false, error: 'text notifikasi diperlukan' });

  const matches = text.replace(/\./g, '').match(/\d+/g);
  if (!matches)
    return res.status(400).json({ ok: false, error: 'Tidak ada angka di teks notifikasi' });

  const amount = Math.max(...matches.map(Number));

  await expireOldOrders();

  const { data: orders } = await supabase
    .from('beta_orders')
    .select('*')
    .eq('total_amount', amount)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  const order = orders?.[0];

  if (!order) {
    await sendDiscord(`⚠️ **Pembayaran tidak dikenal**\nNominal: Rp ${amount.toLocaleString('id-ID')}\nTidak ada order pending yang cocok.`);
    return res.status(404).json({ ok: false, error: 'Order tidak ditemukan untuk nominal ini' });
  }

  await supabase
    .from('beta_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', order.id);

  const rconResult = await executeRcon(order);

  const statusMsg = rconResult.ok
    ? `✅ **Pembayaran BERHASIL**\nNick: \`${order.nick}\`\nTipe: ${order.type}\nNominal: Rp ${amount.toLocaleString('id-ID')}\nRCON: ${rconResult.response || 'OK'}`
    : `✅ Dibayar | ⚠️ **RCON Gagal**\nNick: \`${order.nick}\`\nTipe: ${order.type}\nNominal: Rp ${amount.toLocaleString('id-ID')}\nError: ${rconResult.error}`;

  await sendDiscord(statusMsg);

  return res.status(200).json({
    ok: true,
    rcon: rconResult.ok,
    nick: order.nick,
    type: order.type,
  });
}

// ── STATUS ────────────────────────────────────────────────────────────────────
async function handleStatus(req, res) {
  const { orderId } = req.query;
  if (!orderId || typeof orderId !== 'string')
    return res.status(400).json({ ok: false, error: 'orderId diperlukan' });

  const { data: order, error } = await supabase
    .from('beta_orders')
    .select('id, status, nick, type, total_amount, expires_at, paid_at')
    .eq('id', orderId)
    .single();

  if (error || !order)
    return res.status(404).json({ ok: false, error: 'Order tidak ditemukan' });

  if (order.status === 'pending' && new Date(order.expires_at) < new Date()) {
    await supabase.from('beta_orders').update({ status: 'expired' }).eq('id', orderId);
    order.status = 'expired';
  }

  return res.status(200).json({
    ok: true,
    orderId: order.id,
    status: order.status,
    nick: order.nick,
    type: order.type,
    totalAmount: order.total_amount,
    expiresAt: order.expires_at,
    paidAt: order.paid_at,
  });
}

// ── ROUTER ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const { action } = req.query;

  if (action === 'create' && req.method === 'POST') return handleCreate(req, res);
  if (action === 'notify' && req.method === 'POST') return handleNotify(req, res);
  if (action === 'status' && req.method === 'GET') return handleStatus(req, res);

  return res.status(400).json({ ok: false, error: 'action tidak valid' });
}

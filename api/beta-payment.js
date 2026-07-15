// Satu handler untuk semua beta-payment routes
// POST /api/beta-payment?action=create   — buat order baru
// POST /api/beta-payment?action=notify   — notif dari MacroDroid
// GET  /api/beta-payment?action=status&orderId=xxx — cek status

import { setCorsHeaders } from './_auth.js';
import { supabase } from './_supabase.js';
import { grantRank, giveKey, giveMoney } from './_rcon.js';

const SUFFIX_MIN = 1;
const SUFFIX_MAX = 999;
const ORDER_TTL_MS = 30 * 60 * 1000;
const VALID_TYPES = ['rank', 'key', 'skill', 'balance', 'command', 'cosmetic'];
const NOTIFY_SECRET = process.env.NOTIFY_SECRET;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscord(embed) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch { /* non-fatal */ }
}

function formatRp(n) {
  return `Rp ${Number(n).toLocaleString('id-ID')}`;
}

const TYPE_LABEL = {
  rank: '🎖️ Rank',
  key: '🗝️ Gacha Key',
  skill: '⚡ Skill Boost',
  balance: '💰 Balance',
  command: '⌨️ Command',
  cosmetic: '✨ Custom Prefix',
};

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

  // Buat invoice di DB dulu (fallback jika beta gagal)
  let invoiceId = null;
  try {
    const { data: inv } = await supabase
      .from('invoices')
      .insert({
        type,
        nick: nick.trim(),
        platform,
        final_amount: baseAmount,
        payment_method: 'QRIS',
        details: details || {},
        expires_at: expiresAt,
      })
      .select('id')
      .single();
    if (inv?.id) invoiceId = inv.id;
  } catch { /* tabel invoices mungkin belum ada — lanjut */ }

  const { data: order, error } = await supabase
    .from('beta_orders')
    .insert({
      suffix, nick: nick.trim(), platform, type,
      base_amount: baseAmount, total_amount: totalAmount,
      details: details || {}, expires_at: expiresAt,
      invoice_id: invoiceId,
    })
    .select('id, suffix, total_amount, expires_at')
    .single();

  if (error) return res.status(500).json({ ok: false, error: 'Gagal membuat order' });

  // Announce ke Discord — embed order baru
  const productFields = [];
  if (details?.target) productFields.push({ name: 'Produk', value: details.target.toUpperCase(), inline: true });
  if (details?.duration) productFields.push({ name: 'Durasi', value: details.duration, inline: true });
  if (details?.keyName) productFields.push({ name: 'Key', value: details.keyName, inline: true });
  if (details?.qty) productFields.push({ name: 'Jumlah', value: `${details.qty}x`, inline: true });

  await sendDiscord({
    title: `📋 Order Baru — ${TYPE_LABEL[type] || type}`,
    color: 0x3b82f6,
    fields: [
      { name: 'Nickname', value: `\`${nick.trim()}\``, inline: true },
      { name: 'Platform', value: platform, inline: true },
      ...productFields,
      { name: '💰 Bayar TEPAT', value: `**${formatRp(order.total_amount)}**`, inline: false },
      { name: '⚠️ Penting', value: 'Nominal harus **exact** — lebih/kurang tidak terdeteksi otomatis & harus diproses manual', inline: false },
    ],
    footer: { text: 'AeroBlast Network • Berlaku 30 menit' },
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    ok: true,
    orderId: order.id,
    suffix: order.suffix,
    totalAmount: order.total_amount,
    expiresAt: order.expires_at,
  });
}

// ── NOTIFY ────────────────────────────────────────────────────────────────────
// Menerima teks notifikasi via query param untuk hindari masalah JSON encoding
// URL: POST /api/beta-payment?action=notify&secret=XXX&text=teks+notif
async function handleNotify(req, res) {
  // Support dua cara: query param (MacroDroid) atau JSON body (fallback)
  let text = req.query.text;
  let secret = req.query.secret;

  if (!text || !secret) {
    // Fallback: coba baca dari body
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* abaikan — coba ambil mentah */ }
    }
    if (typeof body === 'object' && body !== null) {
      text = text || body.text;
      secret = secret || body.secret;
    } else if (typeof body === 'string') {
      text = text || body;
    }
  }

  if (!NOTIFY_SECRET || secret !== NOTIFY_SECRET)
    return res.status(401).json({ ok: false, error: 'Unauthorized' });

  if (!text || !String(text).trim())
    return res.status(400).json({ ok: false, error: 'text notifikasi diperlukan' });

  const matches = String(text).replace(/\./g, '').match(/\d+/g);
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
    await sendDiscord({
      title: '⚠️ Pembayaran Tidak Dikenal',
      color: 0xf59e0b,
      fields: [
        { name: 'Nominal Masuk', value: formatRp(amount), inline: true },
        { name: 'Status', value: 'Tidak ada order pending yang cocok', inline: false },
        { name: 'Tindakan', value: 'Kemungkinan nominal tidak exact — proses **manual** diperlukan', inline: false },
      ],
      footer: { text: 'AeroBlast Network' },
      timestamp: new Date().toISOString(),
    });
    return res.status(404).json({ ok: false, error: 'Order tidak ditemukan untuk nominal ini' });
  }

  await supabase
    .from('beta_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', order.id);

  // Hapus invoice dari DB karena otomatis sudah berhasil
  if (order.invoice_id) {
    await supabase.from('invoices').delete().eq('id', order.invoice_id);
  }

  const rconResult = await executeRcon(order);

  const rconOk = rconResult.ok;
  await sendDiscord({
    title: rconOk ? '✅ Pembayaran Berhasil' : '✅ Dibayar — ⚠️ RCON Gagal',
    color: rconOk ? 0x22c55e : 0xef4444,
    fields: [
      { name: 'Nickname', value: `\`${order.nick}\``, inline: true },
      { name: 'Platform', value: order.platform, inline: true },
      { name: 'Tipe', value: TYPE_LABEL[order.type] || order.type, inline: true },
      { name: 'Nominal Diterima', value: formatRp(amount), inline: true },
      rconOk
        ? { name: 'RCON', value: rconResult.response || 'OK', inline: false }
        : { name: 'Error RCON', value: rconResult.error || 'Unknown', inline: false },
    ],
    footer: { text: 'AeroBlast Network' },
    timestamp: new Date().toISOString(),
  });

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
  if (action === 'notify') return handleNotify(req, res); // GET atau POST
  if (action === 'status' && req.method === 'GET') return handleStatus(req, res);

  return res.status(400).json({ ok: false, error: 'action tidak valid' });
}

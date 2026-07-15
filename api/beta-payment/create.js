import { setCorsHeaders } from '../_auth.js';
import { supabase } from '../_supabase.js';

// Pool suffix: 1001 s/d 2000
const SUFFIX_MIN = 1001;
const SUFFIX_MAX = 2000;
const ORDER_TTL_MS = 30 * 60 * 1000; // 30 menit

const VALID_TYPES = ['rank', 'key', 'skill', 'balance', 'command', 'cosmetic'];

// Ambil suffix yang sedang tidak dipakai (status bukan 'pending')
async function allocateSuffix() {
  // Cari semua suffix yang sedang pending
  const { data: pending } = await supabase
    .from('beta_orders')
    .select('suffix')
    .eq('status', 'pending');

  const usedSuffixes = new Set((pending || []).map((r) => r.suffix));

  for (let s = SUFFIX_MIN; s <= SUFFIX_MAX; s++) {
    if (!usedSuffixes.has(s)) return s;
  }
  return null; // pool penuh (>1000 order pending simultan)
}

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

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

  // Expired order yang sudah lewat TTL — bebaskan suffix-nya
  await supabase
    .from('beta_orders')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  const suffix = await allocateSuffix();
  if (suffix === null) {
    return res.status(503).json({ ok: false, error: 'Server sibuk, coba lagi nanti' });
  }

  const totalAmount = baseAmount + suffix;
  const expiresAt = new Date(Date.now() + ORDER_TTL_MS).toISOString();

  const { data: order, error } = await supabase
    .from('beta_orders')
    .insert({
      suffix,
      nick: nick.trim(),
      platform,
      type,
      base_amount: baseAmount,
      total_amount: totalAmount,
      details: details || {},
      expires_at: expiresAt,
    })
    .select('id, suffix, total_amount, expires_at')
    .single();

  if (error) {
    console.error('beta-payment/create DB error:', error.message);
    return res.status(500).json({ ok: false, error: 'Gagal membuat order' });
  }

  return res.status(200).json({
    ok: true,
    orderId: order.id,
    suffix: order.suffix,
    totalAmount: order.total_amount,
    expiresAt: order.expires_at,
  });
}

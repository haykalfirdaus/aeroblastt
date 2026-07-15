// Frontend polling: cek status order berdasarkan orderId
// GET /api/beta-payment/status?orderId=xxx

import { setCorsHeaders } from '../_auth.js';
import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { orderId } = req.query;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ ok: false, error: 'orderId diperlukan' });
  }

  const { data: order, error } = await supabase
    .from('beta_orders')
    .select('id, status, nick, type, total_amount, expires_at, paid_at')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    return res.status(404).json({ ok: false, error: 'Order tidak ditemukan' });
  }

  // Auto-expire jika sudah lewat waktu
  if (order.status === 'pending' && new Date(order.expires_at) < new Date()) {
    await supabase
      .from('beta_orders')
      .update({ status: 'expired' })
      .eq('id', orderId);
    order.status = 'expired';
  }

  return res.status(200).json({
    ok: true,
    orderId: order.id,
    status: order.status,       // pending | paid | expired | failed
    nick: order.nick,
    type: order.type,
    totalAmount: order.total_amount,
    expiresAt: order.expires_at,
    paidAt: order.paid_at,
  });
}

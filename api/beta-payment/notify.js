// Endpoint ini di-POST oleh MacroDroid di HP setiap ada notif GoPay masuk.
// MacroDroid kirim raw teks notifikasi, server yang ekstrak nominalnya.
//
// Body yang dikirim MacroDroid:
// { "text": "teks notifikasi GoPay", "secret": "NOTIFY_SECRET_env_var" }

import { supabase } from '../_supabase.js';
import { grantRank, giveKey, giveMoney } from '../_rcon.js';

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

async function executeRcon(order) {
  const { type, nick, details } = order;

  if (type === 'rank') {
    return grantRank(nick, details.target, details.duration);
  }
  if (type === 'key') {
    return giveKey(nick, details.keyName, details.qty ?? 1);
  }
  if (type === 'balance') {
    return giveMoney(nick, details.balance);
  }
  // Tipe lain (skill, command, cosmetic) perlu penanganan manual — catat di Discord
  return { ok: false, error: `Tipe '${type}' belum di-handle RCON otomatis` };
}

export default async function handler(req, res) {
  // Tidak perlu CORS — hanya dipanggil dari HP internal
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  const { text, secret } = body || {};

  // Validasi secret — cegah request nakal dari internet
  if (!NOTIFY_SECRET || secret !== NOTIFY_SECRET) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'text notifikasi diperlukan' });
  }

  // Ekstrak semua angka dari teks notif, ambil yang paling besar (itu nominalnya)
  // Contoh teks: "Kamu menerima Rp51.001 dari Budi ***"
  const matches = text.replace(/\./g, '').match(/\d+/g);
  if (!matches) {
    return res.status(400).json({ ok: false, error: 'Tidak ada angka ditemukan di teks notifikasi' });
  }
  const amount = Math.max(...matches.map(Number));

  // Bebaskan expired orders dulu
  await supabase
    .from('beta_orders')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  // Cari order pending dengan total_amount yang sama
  const { data: orders } = await supabase
    .from('beta_orders')
    .select('*')
    .eq('total_amount', amount)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  const order = orders?.[0];

  if (!order) {
    await sendDiscord(
      `⚠️ **Pembayaran tidak dikenal**\nNominal: Rp ${amount.toLocaleString('id-ID')}\nTidak ada order pending yang cocok.`
    );
    return res.status(404).json({ ok: false, error: 'Order tidak ditemukan untuk nominal ini' });
  }

  // Tandai paid
  await supabase
    .from('beta_orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', order.id);

  // Jalankan RCON
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
    message: rconResult.ok ? 'Order diproses dan RCON berhasil' : 'Order ditandai paid, RCON gagal — cek Discord',
  });
}

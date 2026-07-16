import { NextResponse } from 'next/server';
import { supabase } from '@/api/_supabase';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const VALID_TYPES = ['rank', 'key', 'skill', 'balance', 'command', 'cosmetic'];

const requests = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.windowStart > 60_000) {
    requests.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

const ORDER_COLORS = { rank: 0x3b82f6, key: 0xf59e0b, skill: 0x10b981, balance: 0x8b5cf6, command: 0xef4444, cosmetic: 0xec4899 };
const ORDER_TITLES = { rank: '🎖️ Order Rank', key: '🗝️ Order Gacha Key', skill: '⚡ Order Skill Boost', balance: '💰 Order Balance', command: '⌨️ Order Command', cosmetic: '✨ Order Custom Prefix' };

function s(val, limit = 100) { return String(val ?? '').slice(0, limit); }

function buildDetails(type, body) {
  const d = {};
  if (type === 'rank') { d.target = body.target; if (body.owned && body.owned !== 'none') d.owned = body.owned; d.duration = body.duration; if (body.basePrice) d.basePrice = body.basePrice; }
  else if (type === 'key') { d.keyName = body.keyName; d.qty = body.qty; }
  else if (type === 'skill') { d.skillName = body.skillName; d.levels = body.levels; }
  else if (type === 'balance') { d.balance = body.balance; }
  else if (type === 'command') { d.cmdName = body.cmdName; d.duration = body.duration; }
  else if (type === 'cosmetic') { d.prefixText = body.prefixText; d.prefixColor = body.prefixColor; if (body.nickColor) d.nickColor = body.nickColor; }
  if (body.discountPct > 0) d.discountPct = body.discountPct;
  return d;
}

function buildEmbed(body, invoiceId) {
  const { type, nick, platform, finalAmount, paymentMethod, discountPct } = body;
  const fields = [
    { name: 'Invoice ID', value: `\`${invoiceId.slice(0, 8).toUpperCase()}\``, inline: true },
    { name: 'Nickname', value: s(nick), inline: true },
    { name: 'Platform', value: s(platform), inline: true },
    { name: 'Pembayaran', value: s(paymentMethod), inline: true },
  ];
  if (type === 'rank') { fields.push({ name: 'Rank Tujuan', value: s(body.target), inline: true }); if (body.owned && body.owned !== 'none') fields.push({ name: 'Upgrade Dari', value: s(body.owned).toUpperCase(), inline: true }); fields.push({ name: 'Durasi', value: s(body.duration), inline: true }); }
  else if (type === 'key') { fields.push({ name: 'Tipe Key', value: s(body.keyName), inline: true }); fields.push({ name: 'Jumlah', value: `${body.qty}x`, inline: true }); }
  else if (type === 'skill') { fields.push({ name: 'Skill', value: s(body.skillName), inline: true }); fields.push({ name: 'Level', value: `${body.levels}x`, inline: true }); }
  else if (type === 'balance') { fields.push({ name: 'Balance', value: Number(body.balance).toLocaleString('id-ID'), inline: true }); }
  else if (type === 'command') { fields.push({ name: 'Command', value: s(body.cmdName), inline: true }); fields.push({ name: 'Durasi', value: s(body.duration), inline: true }); }
  else if (type === 'cosmetic') { fields.push({ name: 'Prefix', value: `[${s(body.prefixText, 50)}]`, inline: true }); fields.push({ name: 'Warna Prefix', value: s(body.prefixColor, 50), inline: true }); if (body.nickColor) fields.push({ name: 'Warna Nick', value: s(body.nickColor, 50), inline: true }); }
  if (discountPct > 0) fields.push({ name: 'Diskon', value: `${discountPct}%`, inline: true });
  fields.push({ name: 'Total Bayar', value: formatRupiah(finalAmount), inline: true });
  fields.push({ name: 'Status', value: '⏳ Menunggu Pembayaran', inline: true });
  return { title: ORDER_TITLES[type] || '📦 Order Baru', color: ORDER_COLORS[type] || 0x3b82f6, fields, footer: { text: 'AeroBlast Network • Invoice berlaku 24 jam' }, timestamp: new Date().toISOString() };
}

export async function POST(request) {
  if (!DISCORD_WEBHOOK_URL) return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) return NextResponse.json({ ok: false, error: 'Terlalu banyak request.' }, { status: 429 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const { type, nick, platform, finalAmount, paymentMethod } = body || {};
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ ok: false, error: 'type tidak valid' }, { status: 400 });
  if (!nick?.trim() || !/^[a-zA-Z0-9_.]{1,36}$/.test(nick.trim())) return NextResponse.json({ ok: false, error: 'nick tidak valid' }, { status: 400 });
  if (!platform) return NextResponse.json({ ok: false, error: 'platform diperlukan' }, { status: 400 });
  if (!finalAmount || finalAmount <= 0) return NextResponse.json({ ok: false, error: 'finalAmount tidak valid' }, { status: 400 });
  if (!paymentMethod) return NextResponse.json({ ok: false, error: 'paymentMethod diperlukan' }, { status: 400 });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  let invoiceId = 'PENDING';
  try {
    const { data: invoice, error } = await supabase.from('invoices').insert({ type, nick: nick.trim(), platform, final_amount: finalAmount, payment_method: paymentMethod, details: buildDetails(type, body), expires_at: expiresAt }).select('id').single();
    if (!error && invoice?.id) invoiceId = invoice.id;
  } catch { /* tabel belum ada */ }

  try {
    const webhookRes = await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [buildEmbed(body, invoiceId)] }) });
    if (!webhookRes.ok) throw new Error(`Discord HTTP ${webhookRes.status}`);
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Gagal kirim notifikasi Discord', detail: err.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, invoiceId });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

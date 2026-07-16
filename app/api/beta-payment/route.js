import { NextResponse } from 'next/server';
import { supabase } from '@/api/_supabase';
import { grantRank, giveKey, giveMoney } from '@/api/_rcon';
import { rateLimit } from '@/api/_ratelimit';
import { getMinBaseAmount } from '@/api/_prices';

const SUFFIX_MIN = 1;
const SUFFIX_MAX = 999;
const ORDER_TTL_MS = 30 * 60 * 1000;
const VALID_TYPES = ['rank', 'key', 'skill', 'balance', 'command', 'cosmetic'];
const NOTIFY_SECRET = process.env.NOTIFY_SECRET;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function formatRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}`; }
const TYPE_LABEL = { rank: '🎖️ Rank', key: '🗝️ Gacha Key', skill: '⚡ Skill Boost', balance: '💰 Balance', command: '⌨️ Command', cosmetic: '✨ Custom Prefix' };

function getIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function sendDiscord(embed) {
  if (!DISCORD_WEBHOOK_URL) return;
  try { await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) }); } catch { }
}

async function expireOldOrders() {
  const { data: expiring } = await supabase.from('beta_orders').select('id, invoice_id').eq('status', 'pending').lt('expires_at', new Date().toISOString());
  if (!expiring?.length) return;
  const ids = expiring.map(r => r.id);
  const invoiceIds = expiring.map(r => r.invoice_id).filter(Boolean);
  await supabase.from('beta_orders').update({ status: 'expired' }).in('id', ids);
  if (invoiceIds.length) await supabase.from('invoices').delete().in('id', invoiceIds);
}

async function allocateSuffix() {
  const { data: pending } = await supabase.from('beta_orders').select('suffix').eq('status', 'pending');
  const used = new Set((pending || []).map(r => r.suffix));
  for (let s = SUFFIX_MIN; s <= SUFFIX_MAX; s++) { if (!used.has(s)) return s; }
  return null;
}

async function executeRcon(order) {
  const { type, nick, details } = order;
  if (type === 'rank') return grantRank(nick, details.target, details.duration);
  if (type === 'key') return giveKey(nick, details.keyName, details.qty ?? 1);
  if (type === 'balance') return giveMoney(nick, details.balance);
  return { ok: false, error: `Tipe '${type}' belum di-handle RCON otomatis` };
}

async function handleCreate(body, request) {
  // Rate limit: 5 order per IP per 10 menit
  const rl = rateLimit(getIp(request), { max: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: `Terlalu banyak request. Coba lagi dalam ${rl.retryAfter} detik.` }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });

  const { type, nick, platform, baseAmount, details } = body || {};
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ ok: false, error: 'type tidak valid' }, { status: 400 });
  if (!nick?.trim() || !/^[a-zA-Z0-9_.]{1,36}$/.test(nick.trim())) return NextResponse.json({ ok: false, error: 'nick tidak valid' }, { status: 400 });
  if (!platform) return NextResponse.json({ ok: false, error: 'platform diperlukan' }, { status: 400 });

  const amount = Number(baseAmount);
  if (!amount || amount <= 0 || !Number.isInteger(amount)) return NextResponse.json({ ok: false, error: 'baseAmount tidak valid' }, { status: 400 });

  // Validasi harga server-side — tolak kalau di bawah minimum produk
  const minAmount = getMinBaseAmount(type, details);
  if (minAmount === null) return NextResponse.json({ ok: false, error: 'Detail produk tidak valid' }, { status: 400 });
  if (amount < minAmount) return NextResponse.json({ ok: false, error: `Nominal terlalu kecil (minimum ${formatRp(minAmount)})` }, { status: 400 });

  await expireOldOrders();
  const suffix = await allocateSuffix();
  if (suffix === null) return NextResponse.json({ ok: false, error: 'Server sibuk, coba lagi nanti' }, { status: 503 });

  const totalAmount = amount + suffix;
  const expiresAt = new Date(Date.now() + ORDER_TTL_MS).toISOString();

  let invoiceId = null;
  try {
    const { data: inv } = await supabase.from('invoices').insert({ type, nick: nick.trim(), platform, final_amount: amount, payment_method: 'QRIS', details: details || {}, expires_at: expiresAt }).select('id').single();
    if (inv?.id) invoiceId = inv.id;
  } catch { }

  const { data: order, error } = await supabase.from('beta_orders').insert({ suffix, nick: nick.trim(), platform, type, base_amount: amount, total_amount: totalAmount, details: details || {}, expires_at: expiresAt, invoice_id: invoiceId }).select('id, suffix, total_amount, expires_at').single();
  if (error) return NextResponse.json({ ok: false, error: 'Gagal membuat order' }, { status: 500 });

  const productFields = [];
  if (details?.target) productFields.push({ name: 'Produk', value: details.target.toUpperCase(), inline: true });
  if (details?.duration) productFields.push({ name: 'Durasi', value: details.duration, inline: true });
  if (details?.keyName) productFields.push({ name: 'Key', value: details.keyName, inline: true });
  if (details?.qty) productFields.push({ name: 'Jumlah', value: `${details.qty}x`, inline: true });
  if (details?.balance) productFields.push({ name: 'Balance', value: Number(details.balance).toLocaleString('id-ID'), inline: true });

  await sendDiscord({ title: `📋 Order Masuk — ${TYPE_LABEL[type] || type}`, color: 0x3b82f6, fields: [{ name: 'Nickname', value: `\`${nick.trim()}\``, inline: true }, { name: 'Platform', value: platform, inline: true }, ...productFields, { name: '💰 Nominal Pembayaran', value: `**${formatRp(order.total_amount)}**`, inline: false }], footer: { text: 'AeroBlast Network • Berlaku 30 menit' }, timestamp: new Date().toISOString() });

  return NextResponse.json({ ok: true, orderId: order.id, suffix: order.suffix, totalAmount: order.total_amount, expiresAt: order.expires_at });
}

async function handleNotify(request) {
  const { searchParams } = new URL(request.url);
  let text = searchParams.get('text');
  let secret = searchParams.get('secret');

  if (!text || !secret) {
    try { const b = await request.json(); text = text || b.text; secret = secret || b.secret; } catch { }
  }

  if (!NOTIFY_SECRET || secret !== NOTIFY_SECRET) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (!text?.trim()) return NextResponse.json({ ok: false, error: 'text diperlukan' }, { status: 400 });

  const matches = String(text).replace(/\./g, '').match(/\d+/g);
  if (!matches) return NextResponse.json({ ok: false, error: 'Tidak ada angka di teks' }, { status: 400 });
  const amount = Math.max(...matches.map(Number));

  await expireOldOrders();

  const { data: orders } = await supabase.from('beta_orders').select('*').eq('total_amount', amount).eq('status', 'pending').order('created_at', { ascending: true }).limit(1);
  const order = orders?.[0];

  if (!order) {
    await sendDiscord({ title: '⚠️ Pembayaran Perlu Dicek', color: 0xf59e0b, fields: [{ name: 'Nominal Masuk', value: formatRp(amount), inline: true }, { name: 'Status', value: 'Order tidak ditemukan untuk nominal ini', inline: false }], footer: { text: 'AeroBlast Network' }, timestamp: new Date().toISOString() });
    return NextResponse.json({ ok: false, error: 'Order tidak ditemukan' }, { status: 404 });
  }

  await supabase.from('beta_orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id);
  if (order.invoice_id) await supabase.from('invoices').delete().eq('id', order.invoice_id);

  const rconResult = await executeRcon(order);
  const rconOk = rconResult.ok;

  const productFields = [];
  if (order.details?.target) productFields.push({ name: 'Produk', value: order.details.target.toUpperCase(), inline: true });
  if (order.details?.duration) productFields.push({ name: 'Durasi', value: order.details.duration, inline: true });
  if (order.details?.keyName) productFields.push({ name: 'Key', value: order.details.keyName, inline: true });
  if (order.details?.qty) productFields.push({ name: 'Jumlah', value: `${order.details.qty}x`, inline: true });
  if (order.details?.balance) productFields.push({ name: 'Balance', value: Number(order.details.balance).toLocaleString('id-ID'), inline: true });

  await sendDiscord({ title: rconOk ? '✅ Pembayaran Berhasil' : '✅ Pembayaran Berhasil — ⚠️ Perlu Cek RCON', color: rconOk ? 0x22c55e : 0xf59e0b, fields: [{ name: 'Nickname', value: `\`${order.nick}\``, inline: true }, { name: 'Platform', value: order.platform, inline: true }, { name: 'Tipe', value: TYPE_LABEL[order.type] || order.type, inline: true }, { name: 'Total Dibayar', value: formatRp(amount), inline: true }, ...productFields, rconOk ? { name: 'Item', value: rconResult.response || 'Diberikan', inline: false } : { name: '⚠️ Item Belum Diberikan', value: rconResult.error || 'Silakan cek dan berikan manual', inline: false }], footer: { text: 'AeroBlast Network' }, timestamp: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}

async function handleStatus(request) {
  const orderId = new URL(request.url).searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ ok: false, error: 'orderId diperlukan' }, { status: 400 });

  // Hanya ambil field yang dibutuhkan client — jangan expose nick/type/detail ke publik
  const { data: order, error } = await supabase.from('beta_orders').select('id, status, expires_at, paid_at').eq('id', orderId).single();
  if (error || !order) return NextResponse.json({ ok: false, error: 'Order tidak ditemukan' }, { status: 404 });

  if (order.status === 'pending' && new Date(order.expires_at) < new Date()) {
    await supabase.from('beta_orders').update({ status: 'expired' }).eq('id', orderId);
    order.status = 'expired';
  }

  return NextResponse.json({ ok: true, orderId: order.id, status: order.status, expiresAt: order.expires_at, paidAt: order.paid_at });
}

export async function POST(request) {
  const action = new URL(request.url).searchParams.get('action');
  if (action === 'create') { const body = await request.json().catch(() => ({})); return handleCreate(body, request); }
  if (action === 'notify') return handleNotify(request);
  return NextResponse.json({ ok: false, error: 'action tidak valid' }, { status: 400 });
}

export async function GET(request) {
  const action = new URL(request.url).searchParams.get('action');
  if (action === 'status') return handleStatus(request);
  if (action === 'notify') return handleNotify(request);
  return NextResponse.json({ ok: false, error: 'action tidak valid' }, { status: 400 });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }

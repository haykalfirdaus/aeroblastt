import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabase } from '@/api/_supabase';
import { grantRank, giveKey, giveMoney } from '@/api/_rcon';
import { rateLimit } from '@/api/_ratelimit';
import { getMinBaseAmount } from '@/api/_prices';
import { isValidOrigin } from '@/api/_auth';

const SUFFIX_MIN = 1;
const SUFFIX_MAX = 999;
const ORDER_TTL_MS = 30 * 60 * 1000;
const VALID_TYPES = ['rank', 'key', 'skill', 'balance', 'command', 'cosmetic', 'donate'];
const DONATE_MIN = 1000;
const DONATE_MAX = 100_000_000;
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
  if (!supabase) return;
  const now = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: expiring } = await supabase.from('beta_orders').select('id, invoice_id').eq('status', 'pending').lt('expires_at', now);
  if (expiring?.length) {
    const ids = expiring.map(r => r.id);
    const invoiceIds = expiring.map(r => r.invoice_id).filter(Boolean);
    await supabase.from('beta_orders').update({ status: 'expired' }).in('id', ids);
    if (invoiceIds.length) await supabase.from('invoices').delete().in('id', invoiceIds);
  }

  await supabase.from('beta_orders').delete().eq('status', 'expired').lt('expires_at', oneHourAgo);
  await supabase.from('beta_orders').delete().eq('type', 'donate').eq('status', 'paid').lt('paid_at', oneHourAgo);
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
  if (type === 'donate') return { ok: true, response: 'Donasi diterima — tidak ada item RCON' };
  return { ok: false, error: `Tipe '${type}' belum di-handle RCON otomatis` };
}

async function handleCreate(body, request) {
  if (!supabase) return NextResponse.json({ ok: false, error: 'Database tidak terkonfigurasi' }, { status: 503 });
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  const rl = rateLimit(getIp(request), { max: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: `Terlalu banyak request. Coba lagi dalam ${rl.retryAfter} detik.` }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });

  const { type, nick, platform, baseAmount, details } = body || {};
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ ok: false, error: 'type tidak valid' }, { status: 400 });

  const amount = Number(baseAmount);
  if (!amount || amount <= 0 || !Number.isInteger(amount)) return NextResponse.json({ ok: false, error: 'baseAmount tidak valid' }, { status: 400 });

  // ── Donate: validasi berbeda (no nick/platform required) ─────────────────────
  if (type === 'donate') {
    if (amount < DONATE_MIN || amount > DONATE_MAX) {
      return NextResponse.json({ ok: false, error: `Nominal donasi harus antara ${formatRp(DONATE_MIN)} – ${formatRp(DONATE_MAX)}` }, { status: 400 });
    }

    await expireOldOrders();
    const suffix = await allocateSuffix();
    if (suffix === null) return NextResponse.json({ ok: false, error: 'Server sibuk, coba lagi nanti' }, { status: 503 });

    const totalAmount = amount + suffix;
    const expiresAt = new Date(Date.now() + ORDER_TTL_MS).toISOString();

    const { data: order, error } = await supabase.from('beta_orders').insert({
      suffix,
      nick: String(details?.name || 'Anonim').slice(0, 40),
      platform: 'QRIS',
      type: 'donate',
      base_amount: amount,
      total_amount: totalAmount,
      details: { name: details?.name || 'Anonim', nick: details?.nick || null, message: details?.message || '' },
      expires_at: expiresAt,
    }).select('id, suffix, total_amount, expires_at').single();
    if (error) return NextResponse.json({ ok: false, error: 'Gagal membuat order' }, { status: 500 });

    return NextResponse.json({ ok: true, orderId: order.id, suffix: order.suffix, totalAmount: order.total_amount, expiresAt: order.expires_at });
  }

  // ── Normal order ──────────────────────────────────────────────────────────────
  if (!nick?.trim() || !/^[a-zA-Z0-9_.]{1,36}$/.test(nick.trim())) return NextResponse.json({ ok: false, error: 'nick tidak valid' }, { status: 400 });
  if (!platform) return NextResponse.json({ ok: false, error: 'platform diperlukan' }, { status: 400 });

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
  // Rate limit: 20 req/menit — sebelum baca body
  const ip = getIp(request);
  const rl = rateLimit(ip, { max: 20, windowMs: 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Terlalu banyak request.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });

  // Secret HANYA dari body (bukan query string — query masuk ke server log)
  let text, secret;
  try { const b = await request.json(); text = b.text; secret = b.secret; } catch { }

  if (!NOTIFY_SECRET) return NextResponse.json({ ok: false, error: 'NOTIFY_SECRET tidak dikonfigurasi' }, { status: 500 });
  // Timing-safe comparison — cegah timing attack
  const secretBuf = Buffer.from(String(secret ?? ''));
  const expectedBuf = Buffer.from(NOTIFY_SECRET);
  const valid = secretBuf.length === expectedBuf.length && crypto.timingSafeEqual(secretBuf, expectedBuf);
  if (!valid) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (!text?.trim()) return NextResponse.json({ ok: false, error: 'text diperlukan' }, { status: 400 });

  const matches = String(text).replace(/\./g, '').match(/\d+/g);
  if (!matches) return NextResponse.json({ ok: false, error: 'Tidak ada angka di teks' }, { status: 400 });

  // Coba semua angka dari notifikasi (bukan hanya max) supaya nomor ref transaksi
  // tidak mengalahkan nominal transfer yang kecil
  const candidates = [...new Set(matches.map(Number).filter(n => n >= 1000 && n <= 100_000_999))];

  await expireOldOrders();

  let order = null;
  let amount = 0;
  for (const candidate of candidates) {
    const { data: orders } = await supabase.from('beta_orders').select('*').eq('total_amount', candidate).eq('status', 'pending').order('created_at', { ascending: true }).limit(1);
    if (orders?.[0]) { order = orders[0]; amount = candidate; break; }
  }

  if (!order) {
    const tried = candidates.length ? candidates.join(', ') : 'tidak ada';
    await sendDiscord({ title: '⚠️ Pembayaran Perlu Dicek', color: 0xf59e0b, fields: [{ name: 'Nominal Dicoba', value: tried, inline: true }, { name: 'Status', value: 'Order tidak ditemukan untuk nominal ini', inline: false }], footer: { text: 'AeroBlast Network' }, timestamp: new Date().toISOString() });
    return NextResponse.json({ ok: false, error: 'Order tidak ditemukan' }, { status: 404 });
  }

  // ── Donate: simpan ke donations table, announce Discord, tandai paid ─────────
  if (order.type === 'donate') {
    const donorName = order.details?.name || order.nick || 'Anonim';
    const donorMsg = order.details?.message || '';
    const donorNick = order.details?.nick || null;
    const paidAt = new Date().toISOString();

    // Tandai paid dulu — client polling handleStatus akan detect ini
    await supabase.from('beta_orders').update({ status: 'paid', paid_at: paidAt }).eq('id', order.id);

    await supabase.from('donations').insert({
      donor_name: donorName.slice(0, 40),
      nick: donorNick ? donorNick.slice(0, 36) : null,
      amount,
      message: donorMsg.slice(0, 200),
      paid_at: paidAt,
    });

    const donateFields = [
      { name: 'Donatur', value: donorName, inline: true },
      { name: 'Nominal', value: `**${formatRp(amount)}**`, inline: true },
    ];
    if (donorNick) donateFields.push({ name: 'Minecraft Nick', value: `\`${donorNick}\``, inline: true });
    if (donorMsg) donateFields.push({ name: 'Pesan', value: `"${donorMsg}"`, inline: false });
    await sendDiscord({ title: '💚 Donasi Diterima!', color: 0x84cc16, fields: donateFields, footer: { text: 'AeroBlast Network • Donasi via QRIS' }, timestamp: new Date().toISOString() });

    return NextResponse.json({ ok: true, type: 'donate' });
  }

  // ── Normal order ──────────────────────────────────────────────────────────────
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
  if (!supabase) return NextResponse.json({ ok: false, error: 'Database tidak terkonfigurasi' }, { status: 503 });
  const orderId = new URL(request.url).searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ ok: false, error: 'orderId diperlukan' }, { status: 400 });

  const { data: order, error } = await supabase.from('beta_orders').select('id, type, status, expires_at, paid_at').eq('id', orderId).single();

  // Order tidak ditemukan = sudah dihapus (expired/cleaned) — kembalikan expired agar client bisa transisi
  if (error || !order) return NextResponse.json({ ok: true, status: 'expired' });

  if (order.status === 'pending' && new Date(order.expires_at) < new Date()) {
    // Selalu update ke 'expired' (jangan langsung DELETE) supaya polling berikutnya masih dapat status yang benar.
    // Cron cleanup & expireOldOrders akan DELETE setelah cukup lama.
    await supabase.from('beta_orders').update({ status: 'expired' }).eq('id', orderId);
    order.status = 'expired';
  }

  return NextResponse.json({ ok: true, orderId: order.id, status: order.status, expiresAt: order.expires_at, paidAt: order.paid_at });
}

export async function POST(request) {
  try {
    const action = new URL(request.url).searchParams.get('action');
    if (action === 'create') { const body = await request.json().catch(() => ({})); return await handleCreate(body, request); }
    if (action === 'notify') return await handleNotify(request);
    return NextResponse.json({ ok: false, error: 'action tidak valid' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const action = new URL(request.url).searchParams.get('action');
    if (action === 'status') return await handleStatus(request);
    return NextResponse.json({ ok: false, error: 'action tidak valid' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }

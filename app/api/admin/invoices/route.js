import { NextResponse } from 'next/server';
import { isAuthenticated, isValidOrigin } from '@/api/_auth';
import { supabase } from '@/api/_supabase';
import { grantRank, giveMoney, giveKey } from '@/api/_rcon';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const ORDER_LABELS = { rank: '🎖️ Rank', key: '🗝️ Gacha Key', skill: '⚡ Skill Boost', balance: '💰 Balance', command: '⌨️ Command', cosmetic: '✨ Custom Prefix' };

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function toClient(row) {
  return { id: row.id, type: row.type, nick: row.nick, platform: row.platform, finalAmount: row.final_amount, paymentMethod: row.payment_method, details: row.details ?? {}, paid: row.paid, paidAt: row.paid_at, expiresAt: row.expires_at, createdAt: row.created_at };
}

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

async function sendLunasEmbed(invoice, rconResult) {
  if (!DISCORD_WEBHOOK_URL) return;
  const rconOk = rconResult?.ok;
  const fields = [
    { name: 'Invoice ID', value: `\`${invoice.id.slice(0, 8).toUpperCase()}\``, inline: true },
    { name: 'Tipe Order', value: ORDER_LABELS[invoice.type] || invoice.type, inline: true },
    { name: 'Nickname', value: `\`${invoice.nick}\``, inline: true },
    { name: 'Platform', value: invoice.platform, inline: true },
    { name: 'Metode Bayar', value: invoice.payment_method, inline: true },
    { name: 'Total', value: formatRupiah(invoice.final_amount), inline: true },
  ];
  if (invoice.details?.target) fields.push({ name: 'Produk', value: String(invoice.details.target).toUpperCase(), inline: true });
  if (invoice.details?.duration) fields.push({ name: 'Durasi', value: String(invoice.details.duration), inline: true });
  if (invoice.details?.keyName) fields.push({ name: 'Key', value: String(invoice.details.keyName), inline: true });
  if (invoice.details?.qty) fields.push({ name: 'Jumlah', value: `${invoice.details.qty}x`, inline: true });
  if (invoice.details?.balance) fields.push({ name: 'Balance', value: Number(invoice.details.balance).toLocaleString('id-ID'), inline: true });
  if (rconResult !== null) fields.push(rconOk ? { name: 'Item', value: rconResult.response || 'Diberikan', inline: false } : { name: '⚠️ Item Belum Diberikan', value: rconResult.error || 'Silakan cek dan berikan manual', inline: false });
  await fetch(DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [{ title: rconOk ? '✅ Pembayaran Dikonfirmasi' : '✅ Pembayaran Dikonfirmasi — ⚠️ Perlu Cek RCON', color: rconOk ? 0x22c55e : 0xf59e0b, fields, footer: { text: 'AeroBlast Network' }, timestamp: new Date().toISOString() }] }) }).catch(() => {});
}

export async function GET(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('invoices').select('*').eq('paid', false).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
  if (error) { if (error.code === '42P01') return NextResponse.json([]); return NextResponse.json({ ok: false, error: error.message }, { status: 500 }); }
  return NextResponse.json((data ?? []).map(toClient));
}

export async function PATCH(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id diperlukan' }, { status: 400 });

  const { data, error } = await supabase.from('invoices').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', id).eq('paid', false).select().single();
  if (error || !data) return NextResponse.json({ ok: false, error: 'Invoice tidak ditemukan atau sudah lunas' }, { status: 404 });

  const { data: linkedOrder } = await supabase.from('beta_orders').select('id').eq('invoice_id', id).neq('status', 'expired').maybeSingle();
  if (linkedOrder?.id) await supabase.from('beta_orders').update({ status: 'expired' }).eq('id', linkedOrder.id);

  let rconResult = null;
  if (data.type === 'rank' && data.details?.target) rconResult = await grantRank(data.nick, data.details.target, data.details.duration ?? 'permanent');
  else if (data.type === 'balance' && data.details?.balance) rconResult = await giveMoney(data.nick, data.details.balance);
  else if (data.type === 'key' && data.details?.keyName && data.details?.qty) rconResult = await giveKey(data.nick, data.details.keyName, data.details.qty);

  await sendLunasEmbed(data, rconResult);
  await supabase.from('invoices').delete().eq('id', id);
  return NextResponse.json({ ok: true, invoice: toClient(data), rcon: rconResult });
}

export async function DELETE(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id diperlukan' }, { status: 400 });
  await supabase.from('invoices').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }

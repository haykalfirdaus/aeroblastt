import { NextResponse } from 'next/server';
import { isAuthenticated, isValidOrigin } from '@/api/_auth';
import { supabase } from '@/api/_supabase';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function formatRp(n) { return `Rp ${Number(n).toLocaleString('id-ID')}`; }

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

async function sendDiscord(embed) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch { }
}

function toClient(row) {
  return {
    id: row.id,
    donorName: row.details?.name || row.nick || 'Anonim',
    nick: row.details?.nick || null,
    message: row.details?.message || '',
    baseAmount: row.base_amount,
    totalAmount: row.total_amount,
    suffix: row.suffix,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

// GET — daftar pending donate orders untuk admin
export async function GET(request) {
  if (!(await isAuthenticated(makeReq(request)))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('beta_orders')
    .select('id, nick, details, base_amount, total_amount, suffix, expires_at, created_at')
    .eq('type', 'donate')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ ok: true, orders: [] });
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: (data ?? []).map(toClient) });
}

// PATCH — tandai lunas: insert ke donations, Discord, DELETE dari beta_orders
export async function PATCH(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id diperlukan' }, { status: 400 });

  const { data: order, error } = await supabase
    .from('beta_orders')
    .select('*')
    .eq('id', id)
    .eq('type', 'donate')
    .eq('status', 'pending')
    .single();

  if (error || !order) {
    return NextResponse.json({ ok: false, error: 'Order donasi tidak ditemukan atau sudah diproses' }, { status: 404 });
  }

  const donorName = order.details?.name || order.nick || 'Anonim';
  const donorNick = order.details?.nick || null;
  const donorMsg = order.details?.message || '';
  const amount = order.total_amount;

  // Insert ke tabel donations
  const { error: insertErr } = await supabase.from('donations').insert({
    donor_name: donorName.slice(0, 40),
    nick: donorNick ? donorNick.slice(0, 36) : null,
    amount,
    message: donorMsg.slice(0, 200),
    paid_at: new Date().toISOString(),
  });

  if (insertErr) {
    return NextResponse.json({ ok: false, error: 'Gagal menyimpan donasi' }, { status: 500 });
  }

  // Discord announce
  const donateFields = [
    { name: 'Donatur', value: donorName, inline: true },
    { name: 'Nominal', value: `**${formatRp(amount)}**`, inline: true },
  ];
  if (donorNick) donateFields.push({ name: 'Minecraft Nick', value: `\`${donorNick}\``, inline: true });
  if (donorMsg) donateFields.push({ name: 'Pesan', value: `"${donorMsg}"`, inline: false });
  donateFields.push({ name: 'Dikonfirmasi oleh', value: 'Admin (manual)', inline: false });

  await sendDiscord({
    title: '💚 Donasi Diterima!',
    color: 0x84cc16,
    fields: donateFields,
    footer: { text: 'AeroBlast Network • Donasi via QRIS' },
    timestamp: new Date().toISOString(),
  });

  // Hapus order dari beta_orders setelah semua proses selesai
  await supabase.from('beta_orders').delete().eq('id', id).catch(() => {});

  return NextResponse.json({ ok: true });
}

// DELETE — batalkan/hapus donate order tanpa confirm
export async function DELETE(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id diperlukan' }, { status: 400 });

  await supabase.from('beta_orders').delete().eq('id', id).eq('type', 'donate');
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }

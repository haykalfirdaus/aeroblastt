import { NextResponse } from 'next/server';
import { isAuthenticated, isValidOrigin } from '@/api/_auth';
import { supabase } from '@/api/_supabase';

/*
 * Order Custom Prefix yang SUDAH lunas.
 *
 * PNG-nya sendiri tidak pernah dikirim ke pembeli — admin merender &
 * men-download-nya dari dashboard (renderer client-side yang sama dengan
 * preview di store), lalu memasangnya ke resourcepack server. Endpoint ini
 * hanya menyajikan data pesanan, dan HANYA untuk order berstatus paid:
 * belum bayar = tidak muncul = tidak ada PNG yang bisa diambil.
 */

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

export async function GET(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase
    .from('beta_orders')
    .select('id, nick, platform, details, total_amount, paid_at, created_at')
    .eq('type', 'cosmetic')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false });
  if (error) {
    if (error.code === '42P01') return NextResponse.json([]);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    (data ?? []).map((row) => ({
      id: row.id,
      nick: row.nick,
      platform: row.platform,
      details: row.details ?? {},
      totalAmount: row.total_amount,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    })),
  );
}

// Selesai dipasang → hapus dari antrean.
export async function DELETE(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id diperlukan' }, { status: 400 });
  await supabase.from('beta_orders').delete().eq('id', id).eq('type', 'cosmetic');
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

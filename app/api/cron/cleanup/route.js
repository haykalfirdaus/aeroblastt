import { NextResponse } from 'next/server';
import { supabase } from '@/api/_supabase';

export const maxDuration = 30;

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET tidak dikonfigurasi' }, { status: 500 });
  }
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: expiring, error: expErr } = await supabase.from('beta_orders').select('id, invoice_id').eq('status', 'pending').lt('expires_at', now);
  let expiredCount = 0, invoicesDeleted = 0;

  if (!expErr && expiring?.length) {
    const ids = expiring.map(r => r.id);
    const invoiceIds = expiring.map(r => r.invoice_id).filter(Boolean);
    // Semua tipe diset 'expired' — tidak DELETE langsung supaya client polling masih bisa detect
    await supabase.from('beta_orders').update({ status: 'expired' }).in('id', ids);
    expiredCount = ids.length;
    if (invoiceIds.length) { await supabase.from('invoices').delete().in('id', invoiceIds); invoicesDeleted += invoiceIds.length; }
  }

  // DELETE orders expired > 30 menit + donate paid > 30 menit (sudah aman untuk dibersihkan)
  const { error: delBetaErr } = await supabase.from('beta_orders').delete().eq('status', 'expired').lt('expires_at', cutoff);
  await supabase.from('beta_orders').delete().eq('type', 'donate').eq('status', 'paid').lt('paid_at', cutoff);
  const { error: delInvErr } = await supabase.from('invoices').delete().eq('paid', false).lt('expires_at', cutoff);

  return NextResponse.json({ ok: true, expiredCount, invoicesDeleted, errors: [expErr, delBetaErr, delInvErr].filter(Boolean).map(e => e.message), ts: now });
}

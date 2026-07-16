import { supabase } from '../_supabase.js';

// Vercel Cron Job — dipanggil otomatis tiap 15 menit
// Hapus: beta_orders expired + invoices expired yang sudah > 30 menit lewat batas

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  // Vercel mengirim header CRON_SECRET untuk verifikasi
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const now = new Date().toISOString();
  // Grace period: hapus invoice/beta_order yang sudah expired lebih dari 30 menit
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // 1. Expire beta_orders yang masih pending tapi sudah lewat expires_at
  const { data: expiring, error: expErr } = await supabase
    .from('beta_orders')
    .select('id, invoice_id')
    .eq('status', 'pending')
    .lt('expires_at', now);

  let expiredCount = 0;
  let invoicesDeleted = 0;

  if (!expErr && expiring?.length) {
    const ids = expiring.map((r) => r.id);
    const invoiceIds = expiring.map((r) => r.invoice_id).filter(Boolean);

    await supabase.from('beta_orders').update({ status: 'expired' }).in('id', ids);
    expiredCount = ids.length;

    // Hapus invoice yang terasosiasi — auto expired, tidak perlu manual
    if (invoiceIds.length) {
      await supabase.from('invoices').delete().in('id', invoiceIds);
      invoicesDeleted += invoiceIds.length;
    }
  }

  // 2. Hapus beta_orders yang sudah expired > 30 menit
  const { error: delBetaErr } = await supabase
    .from('beta_orders')
    .delete()
    .eq('status', 'expired')
    .lt('expires_at', cutoff);

  // 3. Hapus invoices yang expired > 30 menit dan belum dibayar
  const { error: delInvErr } = await supabase
    .from('invoices')
    .delete()
    .eq('paid', false)
    .lt('expires_at', cutoff);

  return res.status(200).json({
    ok: true,
    expiredCount,
    invoicesDeleted,
    errors: [expErr, delBetaErr, delInvErr].filter(Boolean).map((e) => e.message),
    ts: now,
  });
}

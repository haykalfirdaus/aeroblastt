import { isAuthenticated, setCorsHeaders } from '../_auth.js';
import { supabase } from '../_supabase.js';
import { grantRank } from '../_rcon.js';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const ORDER_LABELS = {
  rank: '🎖️ Rank',
  key: '🗝️ Gacha Key',
  skill: '⚡ Skill Boost',
  balance: '💰 Balance',
  command: '⌨️ Command',
  cosmetic: '✨ Custom Prefix',
};

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function toClient(row) {
  return {
    id: row.id,
    type: row.type,
    nick: row.nick,
    platform: row.platform,
    finalAmount: row.final_amount,
    paymentMethod: row.payment_method,
    details: row.details ?? {},
    paid: row.paid,
    paidAt: row.paid_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

async function sendLunasEmbed(invoice) {
  if (!DISCORD_WEBHOOK_URL) return;
  const embed = {
    title: '✅ PEMBAYARAN LUNAS',
    color: 0x22c55e,
    fields: [
      { name: 'Invoice ID', value: `\`${invoice.id.slice(0, 8).toUpperCase()}\``, inline: true },
      { name: 'Tipe Order', value: ORDER_LABELS[invoice.type] || invoice.type, inline: true },
      { name: 'Nickname', value: invoice.nick, inline: true },
      { name: 'Platform', value: invoice.platform, inline: true },
      { name: 'Metode Bayar', value: invoice.payment_method, inline: true },
      { name: 'Total', value: formatRupiah(invoice.final_amount), inline: true },
    ],
    footer: { text: 'AeroBlast Network • Pembayaran dikonfirmasi admin' },
    timestamp: new Date().toISOString(),
  };
  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  // GET — daftar invoice belum dibayar yang masih aktif
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('paid', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      // Tabel belum dibuat → kembalikan array kosong agar panel tidak crash
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        res.status(200).json([]);
        return;
      }
      res.status(500).json({ ok: false, error: error.message });
      return;
    }

    res.status(200).json((data ?? []).map(toClient));
    return;
  }

  // PATCH — tandai invoice sebagai lunas (tidak langsung dihapus, frontend hapus 1 menit kemudian)
  if (req.method === 'PATCH') {
    const id = req.query?.id || new URL(req.url, 'http://localhost').searchParams.get('id');
    if (!id) {
      res.status(400).json({ ok: false, error: 'id diperlukan' });
      return;
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('id', id)
      .eq('paid', false)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ ok: false, error: 'Invoice tidak ditemukan atau sudah lunas' });
      return;
    }

    // Discord fire-and-forget
    sendLunasEmbed(data).catch(() => {});

    // RCON: beri rank otomatis jika tipe order adalah rank
    let rconResult = null;
    if (data.type === 'rank' && data.details?.target) {
      rconResult = await grantRank(
        data.nick,
        data.details.target,
        data.details.duration ?? 'permanent',
      );
    }

    res.status(200).json({ ok: true, invoice: toClient(data), rcon: rconResult });
    return;
  }

  // DELETE — hapus invoice (dipanggil frontend 1 menit setelah lunas)
  if (req.method === 'DELETE') {
    const id = req.query?.id || new URL(req.url, 'http://localhost').searchParams.get('id');
    if (!id) {
      res.status(400).json({ ok: false, error: 'id diperlukan' });
      return;
    }

    await supabase.from('invoices').delete().eq('id', id).catch(() => {});

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}

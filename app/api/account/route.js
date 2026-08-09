import { NextResponse } from 'next/server';
import { verifyPlayerToken } from '@/api/_auth';
import { supabase } from '@/api/_supabase';
import { getPlayerRankFromLP, getPlayerCommandsFromLP } from '@/api/_mysql';

// Respons bergantung cookie sesi — jangan pernah di-cache/di-prerender.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

/**
 * Ringkasan akun player: invoice/order berjalan, riwayat donasi, rank aktif,
 * dan command aktif. Identitas diambil dari cookie player — client tidak boleh
 * menentukan nick sendiri, supaya data player lain tidak bisa diintip.
 */
export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const nick = verifyPlayerToken({ headers: { cookie: cookieHeader } });
  if (!nick) return NextResponse.json({ ok: false, error: 'Belum login' }, { status: 401, headers: NO_STORE });

  // Rank & command dari LuckPerms — sumber kebenaran live di server.
  const [rankResult, commandsResult] = await Promise.allSettled([
    getPlayerRankFromLP(nick),
    getPlayerCommandsFromLP(nick),
  ]);

  const rank = rankResult.status === 'fulfilled' ? rankResult.value : null;
  const commands = commandsResult.status === 'fulfilled' ? commandsResult.value : [];
  // Bedakan "tidak punya command" dari "DB tidak bisa dibaca".
  const serverDataOk = rankResult.status === 'fulfilled' && commandsResult.status === 'fulfilled';

  let orders = [];
  let donations = [];

  if (supabase) {
    const [orderRes, donationRes] = await Promise.all([
      supabase
        .from('beta_orders')
        .select('id, type, status, base_amount, total_amount, details, created_at, expires_at, paid_at')
        .eq('nick', nick)
        .neq('type', 'donate')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('donations')
        .select('id, amount, message, paid_at')
        .eq('nick', nick)
        .order('paid_at', { ascending: false })
        .limit(20),
    ]);

    orders = orderRes.data || [];
    donations = donationRes.data || [];
  }

  const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  return NextResponse.json({
    ok: true,
    nick,
    rank,
    commands,
    serverDataOk,
    orders,
    donations,
    totalDonated,
  }, { headers: NO_STORE });
}

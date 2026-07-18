import { NextResponse } from 'next/server';
import { supabase } from '@/api/_supabase';

export async function GET(request) {
  const mode = new URL(request.url).searchParams.get('mode');

  if (mode === 'leaderboard') {
    // Leaderboard: GROUP BY nick, SUM(amount) — hanya yang punya nick
    const { data, error } = await supabase
      .from('donations')
      .select('nick, amount')
      .not('nick', 'is', null)
      .order('amount', { ascending: false });

    if (error) return NextResponse.json({ ok: false, error: 'Gagal memuat data' }, { status: 500 });

    // Aggregate per nick di sisi server
    const map = new Map();
    for (const row of data || []) {
      const key = row.nick.toLowerCase();
      if (!map.has(key)) map.set(key, { nick: row.nick, total: 0, count: 0 });
      const entry = map.get(key);
      entry.total += row.amount;
      entry.count += 1;
    }
    const leaderboard = Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    return NextResponse.json({ ok: true, leaderboard });
  }

  // Default: recent donations (tampil semua termasuk anonim, 30 terbaru)
  const { data, error } = await supabase
    .from('donations')
    .select('id, donor_name, nick, amount, message, paid_at')
    .order('paid_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ ok: false, error: 'Gagal memuat data' }, { status: 500 });
  return NextResponse.json({ ok: true, donations: data || [] });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

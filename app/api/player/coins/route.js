import { NextResponse } from 'next/server';
import { verifyPlayerToken } from '@/api/_auth';
import { getPlayerCoins } from '@/api/_rcon';

// Respons bergantung cookie sesi — jangan pernah di-cache/di-prerender.
export const dynamic = 'force-dynamic';

const NICK_RE = /^[a-zA-Z0-9_.]{1,36}$/;
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionNick = verifyPlayerToken({ headers: { cookie: cookieHeader } });

  if (!sessionNick || !NICK_RE.test(sessionNick)) {
    return NextResponse.json({ ok: false, error: 'Belum login' }, { status: 401, headers: NO_STORE });
  }

  const result = await getPlayerCoins(sessionNick);
  return NextResponse.json(result, { headers: NO_STORE });
}

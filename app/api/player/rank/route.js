import { NextResponse } from 'next/server';
import { verifyPlayerToken } from '@/api/_auth';
import { getPlayerRank } from '@/api/_rcon';

// Respons bergantung cookie sesi — jangan pernah di-cache/di-prerender.
export const dynamic = 'force-dynamic';

const NICK_RE = /^[a-zA-Z0-9_.]{1,36}$/;
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionNick = verifyPlayerToken({ headers: { cookie: cookieHeader } });

  const { searchParams } = new URL(request.url);
  const nick = searchParams.get('nick') || sessionNick;

  if (!nick || !NICK_RE.test(nick)) {
    return NextResponse.json({ ok: false, error: 'nick tidak valid' }, { status: 400, headers: NO_STORE });
  }

  const result = await getPlayerRank(nick);
  return NextResponse.json(result, { headers: NO_STORE });
}

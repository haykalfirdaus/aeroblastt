import { NextResponse } from 'next/server';
import { verifyPlayerToken } from '@/api/_auth';
import { getPlayerRank } from '@/api/_rcon';

const NICK_RE = /^[a-zA-Z0-9_.]{1,36}$/;

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionNick = verifyPlayerToken({ headers: { cookie: cookieHeader } });

  const { searchParams } = new URL(request.url);
  const nick = searchParams.get('nick') || sessionNick;

  if (!nick || !NICK_RE.test(nick)) {
    return NextResponse.json({ ok: false, error: 'nick tidak valid' }, { status: 400 });
  }

  const result = await getPlayerRank(nick);
  return NextResponse.json(result);
}

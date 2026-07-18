import { NextResponse } from 'next/server';
import { verifyPlayerToken, isAuthenticated } from '@/api/_auth';
import { getPlayerRank } from '@/api/_rcon';
import { Rcon } from 'rcon-client';

const NICK_RE = /^[a-zA-Z0-9_.]{1,36}$/;

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionNick = verifyPlayerToken({ headers: { cookie: cookieHeader } });

  const { searchParams } = new URL(request.url);
  const nick = searchParams.get('nick') || sessionNick;
  const debug = searchParams.get('debug') === '1';

  if (!nick || !NICK_RE.test(nick)) {
    return NextResponse.json({ ok: false, error: 'nick tidak valid' }, { status: 400 });
  }

  if (debug) {
    // Hanya admin yang bisa lihat raw output — untuk diagnosis parsing
    const adminOk = await isAuthenticated({ headers: { cookie: cookieHeader } });
    if (!adminOk) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    let rcon;
    try {
      rcon = await Rcon.connect({
        host: process.env.RCON_HOST,
        port: Number(process.env.RCON_PORT) || 25575,
        password: process.env.RCON_PASSWORD,
        timeout: 5000,
      });
      const raw = await rcon.send(`lp user ${nick} parent info`);
      return NextResponse.json({ ok: true, raw, nick });
    } catch (err) {
      return NextResponse.json({ ok: false, error: err.message });
    } finally {
      rcon?.end().catch(() => {});
    }
  }

  const result = await getPlayerRank(nick);
  return NextResponse.json(result);
}

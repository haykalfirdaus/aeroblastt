import { NextResponse } from 'next/server';
import { signPlayerToken, verifyPlayerToken, parseCookies } from '@/api/_auth';
import { isRegisteredInAuthme } from '@/api/_mysql';

const NICK_RE = /^[a-zA-Z0-9_.]{1,30}$/;
const isProd = process.env.NODE_ENV !== 'development';

const requests = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.windowStart > 60_000) {
    requests.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

function getIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const nick = verifyPlayerToken({ headers: { cookie: cookieHeader } });
  return NextResponse.json(nick ? { ok: true, nick } : { ok: false });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body?.action;

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('aeroblast_player_session', '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'strict' });
    return res;
  }

  if (action === 'login') {
    if (isRateLimited(getIp(request))) {
      return NextResponse.json({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, { status: 429 });
    }

    const nick = (body?.nick || '').trim();
    if (!NICK_RE.test(nick)) {
      return NextResponse.json({ ok: false, error: 'Username tidak valid (1-16 karakter, hanya huruf/angka/underscore)' }, { status: 400 });
    }

    let registered;
    try {
      registered = await isRegisteredInAuthme(nick);
    } catch (err) {
      return NextResponse.json({ ok: false, error: 'Tidak bisa terhubung ke database. Coba lagi nanti.' }, { status: 503 });
    }

    if (!registered) {
      return NextResponse.json({ ok: false, error: `Username "${nick}" tidak ditemukan di server.` }, { status: 404 });
    }

    const token = signPlayerToken(nick);
    const res = NextResponse.json({ ok: true, nick });
    res.cookies.set('aeroblast_player_session', encodeURIComponent(token), {
      path: '/', maxAge: 86400, httpOnly: true, sameSite: 'strict', secure: isProd,
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: 'action tidak valid. Pilih: login, logout' }, { status: 400 });
}

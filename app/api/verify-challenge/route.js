import { NextResponse } from 'next/server';
import { isValidOrigin } from '@/api/_auth';
import { rateLimit } from '@/api/_ratelimit';
import { signClearance, clearanceGateEnabled, CLEARANCE_COOKIE, CLEARANCE_TTL_MS } from '@/lib/clearance';

/*
 * Tukar token Turnstile (dari halaman /verify) menjadi cookie clearance.
 * Cookie inilah yang dicek proxy.js sebelum melepas /admin* — lihat komentar
 * alur lengkapnya di proxy.js.
 *
 * Verifikasi di sini FAIL-CLOSED: siteverify harus benar-benar sukses.
 * Beda dengan Turnstile di store (fail-soft) karena yang dilindungi di sini
 * pintu admin, bukan alur pembelian player.
 */

const isProd = process.env.NODE_ENV !== 'development';

function getIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(request) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const ip = getIp(request);
  const rl = rateLimit(`verify:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  if (!clearanceGateEnabled()) {
    return NextResponse.json({ ok: false, error: 'Verifikasi tidak dikonfigurasi' }, { status: 503 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { turnstileToken } = body || {};
  if (!turnstileToken || typeof turnstileToken !== 'string') {
    return NextResponse.json({ ok: false, error: 'turnstileToken diperlukan' }, { status: 400 });
  }

  try {
    const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: ip,
      }),
    });
    const vd = await vr.json();
    if (!vd.success) {
      return NextResponse.json({ ok: false, error: 'Verifikasi gagal — muat ulang halaman dan coba lagi' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Layanan verifikasi tidak terjangkau — coba lagi' }, { status: 502 });
  }

  const clearance = await signClearance(ip);
  const maxAge = Math.floor(CLEARANCE_TTL_MS / 1000);
  return NextResponse.json({ ok: true }, {
    headers: {
      'Set-Cookie': `${CLEARANCE_COOKIE}=${clearance}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${isProd ? '; Secure' : ''}`,
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

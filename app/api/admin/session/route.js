import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/api/_supabase';
import { parseCookies, isValidOrigin } from '@/api/_auth';
import { rateLimit } from '@/api/_ratelimit';
import { verifyClearance, clearanceGateEnabled, CLEARANCE_COOKIE } from '@/lib/clearance';

const COOKIE_NAME = 'aeroblast_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const isProd = process.env.NODE_ENV !== 'development';

function setCookieHeader(value, maxAge) {
  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${isProd ? '; Secure' : ''}`;
}

function getIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function GET(request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  const token = cookies[COOKIE_NAME];
  if (!token || !supabaseAuth) return NextResponse.json({ authenticated: false });
  const { data, error } = await supabaseAuth.auth.getUser(token);
  return NextResponse.json({ authenticated: !error && !!data?.user });
}

export async function POST(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  // Rate limit: max 5 login attempt per IP per 15 menit
  const ip = getIp(request);
  const rl = rateLimit(ip, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  // Clearance wajib: login hanya boleh dari browser yang sudah lulus
  // interstitial /verify (Turnstile). Bot yang menembak API ini langsung
  // tanpa cookie clearance ditolak sebelum menyentuh Supabase.
  if (clearanceGateEnabled()) {
    const clearance = parseCookies(request.headers.get('cookie') || '')[CLEARANCE_COOKIE];
    if (!clearance || !(await verifyClearance(clearance, ip))) {
      return NextResponse.json({ ok: false, error: 'Verifikasi keamanan diperlukan — muat ulang halaman.' }, { status: 403 });
    }
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  // Login sepenuhnya server-side: email+password dikirim ke sini, BUKAN ke
  // Supabase langsung dari browser. Dengan begitu rate limit di atas benar-benar
  // menghitung setiap percobaan gagal — brute force ke Supabase langsung tidak
  // mungkin lagi lewat UI, dan token Turnstile bisa diwajibkan per percobaan.
  const { email, password, turnstileToken } = body || {};
  if (!email || !password) return NextResponse.json({ ok: false, error: 'Email dan password diperlukan' }, { status: 400 });
  if (!supabaseAuth) return NextResponse.json({ ok: false, error: 'SUPABASE_ANON_KEY tidak dikonfigurasi' }, { status: 500 });

  // Turnstile per percobaan login — fail-closed selama secret-nya diset.
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    if (!turnstileToken) return NextResponse.json({ ok: false, error: 'Selesaikan verifikasi anti-bot dulu' }, { status: 400 });
    try {
      const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: turnstileSecret, response: turnstileToken, remoteip: ip }),
      });
      const vd = await vr.json();
      if (!vd.success) return NextResponse.json({ ok: false, error: 'Verifikasi anti-bot gagal — coba ulangi' }, { status: 400 });
    } catch {
      return NextResponse.json({ ok: false, error: 'Layanan verifikasi tidak terjangkau — coba lagi' }, { status: 502 });
    }
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error || !data?.session?.access_token) {
    return NextResponse.json({ ok: false, error: 'Email atau password salah' }, { status: 401 });
  }

  return NextResponse.json({ ok: true }, {
    headers: { 'Set-Cookie': setCookieHeader(data.session.access_token, COOKIE_MAX_AGE) },
  });
}

export async function DELETE() {
  return NextResponse.json({ ok: true }, {
    headers: { 'Set-Cookie': setCookieHeader('', 0) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

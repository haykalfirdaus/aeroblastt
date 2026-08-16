import { NextResponse } from 'next/server';
import { verifyClearance, clearanceGateEnabled, CLEARANCE_COOKIE } from '@/lib/clearance';

export const config = {
  matcher: ['/assets/:path*', '/admin', '/admin/:path*'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Gate /admin* — verifikasi keamanan ala Cloudflare (seperti builtbybit.com)
//
// Alur:
//   1. Request ke /admin* tanpa cookie clearance valid → redirect /verify.
//   2. /verify merender widget Turnstile ("Performing security verification");
//      lulus → POST /api/verify-challenge → siteverify → set cookie clearance
//      (HMAC, terikat IP, berlaku 30 menit).
//   3. Request berikutnya lolos gate ini dan halaman admin dirender normal.
//
// Plus rate limit per IP untuk /admin* — bot yang menghajar halaman admin
// dapat 429 di edge sebelum menyentuh render React ataupun API di belakangnya.
// (Login API punya limiter sendiri yang lebih ketat: 5 / 15 menit.)
// ─────────────────────────────────────────────────────────────────────────────

const RATE_MAX = 30;                 // request per window per IP
const RATE_WINDOW_MS = 60 * 1000;    // 1 menit
const rateStore = new Map();         // ip → { count, resetAt } — per edge instance

function rateLimited(ip) {
  const now = Date.now();
  const entry = rateStore.get(ip);
  if (!entry || now > entry.resetAt) {
    // Sapu entri kedaluwarsa sekalian — edge tidak punya setInterval yang awet
    if (rateStore.size > 5000) {
      for (const [key, val] of rateStore.entries()) {
        if (now > val.resetAt) rateStore.delete(key);
      }
    }
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  if (entry.count >= RATE_MAX) return Math.ceil((entry.resetAt - now) / 1000);
  entry.count++;
  return null;
}

function getIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

async function guardAdmin(request) {
  const ip = getIp(request);

  const retryAfter = rateLimited(ip);
  if (retryAfter !== null) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik.` }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) } },
    );
  }

  // Env belum lengkap → jangan kunci admin di luar (fail-soft)
  if (!clearanceGateEnabled()) return NextResponse.next();

  const token = request.cookies.get(CLEARANCE_COOKIE)?.value;
  if (token && await verifyClearance(token, ip)) return NextResponse.next();

  const url = request.nextUrl.clone();
  const redirectTo = url.pathname + url.search;
  url.pathname = '/verify';
  url.search = `?redirect=${encodeURIComponent(redirectTo)}`;
  return NextResponse.redirect(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Anti-hotlink /assets/* — blokir akses langsung ke file asset
// ─────────────────────────────────────────────────────────────────────────────

function guardAssets(request) {
  const url = new URL(request.url);
  const referer = request.headers.get('referer') || '';
  const sec = request.headers.get('sec-fetch-dest') || '';
  const secSite = request.headers.get('sec-fetch-site') || '';

  // Allow requests that originate from the same site (loaded by the page itself)
  // sec-fetch-site: same-origin or none (preload/prefetch from page)
  // sec-fetch-dest: script, style, image, font, etc (browser loading sub-resources)
  const isBrowserSubresource =
    (secSite === 'same-origin' || secSite === 'none') &&
    sec !== 'document' &&
    sec !== 'navigate';

  if (isBrowserSubresource) {
    return; // let through
  }

  // Also allow if referer is from the same origin (older browsers without sec-fetch)
  try {
    const origin = new URL(url.origin);
    const ref = new URL(referer);
    if (ref.origin === origin.origin) return;
  } catch {
    // no referer or invalid — fall through to block
  }

  // Direct access to asset URL → 403
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>403 Forbidden</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#030711;color:#f0f4ff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:12px}.code{font-size:72px;font-weight:800;color:#ef4444;letter-spacing:-2px}.msg{font-size:16px;color:#6b7a99}.sub{font-size:12px;color:#3a4255}</style></head><body><div class="code">403</div><div class="msg">Akses Dilarang</div><div class="sub">Kamu tidak diizinkan mengakses resource ini secara langsung.</div></body></html>',
    {
      status: 403,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );
}

export default async function proxy(request) {
  const { pathname } = new URL(request.url);
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return guardAdmin(request);
  }
  return guardAssets(request);
}

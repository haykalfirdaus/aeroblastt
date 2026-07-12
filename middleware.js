export const config = {
  matcher: ['/assets/:path*'],
};

export default function middleware(request) {
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

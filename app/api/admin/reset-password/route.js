import { NextResponse } from 'next/server';
import { supabase } from '@/api/_supabase';
import { isValidOrigin } from '@/api/_auth';
import { rateLimit } from '@/api/_ratelimit';

function getIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(request) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  // Rate limit ketat: 3 req per 15 menit per IP
  const ip = getIp(request);
  const rl = rateLimit(ip, { max: 3, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { email } = body || {};
  if (!email?.trim()) {
    return NextResponse.json({ ok: false, error: 'email diperlukan' }, { status: 400 });
  }

  // Validasi server-side: hanya email admin yang boleh dapat link reset
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return NextResponse.json({ ok: false, error: 'ADMIN_EMAIL tidak dikonfigurasi' }, { status: 500 });
  }

  // Selalu return 200 agar tidak bisa di-enumerate email mana yang valid
  if (email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ ok: true });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.aeroblast.my.id';
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${siteUrl}/admin/login#reset`,
  });

  if (error) {
    console.error('Reset password error:', error.message);
    return NextResponse.json({ ok: false, error: 'Gagal mengirim link reset' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

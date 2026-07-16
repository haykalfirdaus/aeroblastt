import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/api/_supabase';
import { parseCookies } from '@/api/_auth';

const COOKIE_NAME = 'aeroblast_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const isProd = process.env.NODE_ENV !== 'development';

function setCookieHeader(value, maxAge) {
  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${isProd ? '; Secure' : ''}`;
}

export async function GET(request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  const token = cookies[COOKIE_NAME];
  if (!token || !supabaseAuth) return NextResponse.json({ authenticated: false });
  const { data, error } = await supabaseAuth.auth.getUser(token);
  return NextResponse.json({ authenticated: !error && !!data?.user });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const { access_token } = body || {};
  if (!access_token) return NextResponse.json({ ok: false, error: 'access_token diperlukan' }, { status: 400 });
  if (!supabaseAuth) return NextResponse.json({ ok: false, error: 'SUPABASE_ANON_KEY tidak dikonfigurasi' }, { status: 500 });

  const { data, error } = await supabaseAuth.auth.getUser(access_token);
  if (error || !data?.user) return NextResponse.json({ ok: false, error: 'Token tidak valid' }, { status: 401 });

  return NextResponse.json({ ok: true }, {
    headers: { 'Set-Cookie': setCookieHeader(access_token, COOKIE_MAX_AGE) },
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

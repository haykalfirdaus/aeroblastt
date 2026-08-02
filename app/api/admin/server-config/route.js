import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { isAuthenticated, isValidOrigin } from '@/api/_auth';
import { supabase } from '@/api/_supabase';
import { rateLimit } from '@/api/_ratelimit';
import { SERVER_CONFIG_TAG } from '@/lib/serverConfig';
import { SITE } from '@/data/config';

function toClient(row) {
  return { ip: row.ip, port: row.port, updatedAt: row.updated_at };
}

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

// Hostname (aeroblast.my.id, play.server.net) atau IPv4 (203.0.113.5).
// Sengaja tidak menerima skema/port/path — port punya field sendiri.
const HOST_RE = /^(?=.{1,253}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;

function validate(ip, port) {
  const cleanIp = typeof ip === 'string' ? ip.trim().toLowerCase() : '';
  if (!cleanIp) return { error: 'IP tidak boleh kosong.' };
  if (cleanIp.length > 253) return { error: 'IP terlalu panjang (maks 253 karakter).' };
  if (!HOST_RE.test(cleanIp)) return { error: 'IP tidak valid. Contoh: aeroblast.my.id atau 203.0.113.5' };

  const portNum = Number(String(port).trim());
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
    return { error: 'Port harus angka bulat antara 1 dan 65535.' };
  }

  return { ip: cleanIp, port: String(portNum) };
}

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(ip, { max: 30, windowMs: 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Terlalu banyak request.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });

  // Baca gagal (Supabase belum dikonfigurasi / tabel belum dimigrasi / DB down)
  // tidak boleh membuat panel admin tidak bisa dipakai — jatuh ke SITE.server,
  // sama seperti getServerConfig() yang dipakai situs publik. Kalau memang ada
  // masalah, POST yang akan menyuarakannya dengan jelas saat admin menyimpan.
  const fallback = { ip: SITE.server.ip, port: SITE.server.port, updatedAt: null };
  if (!supabase) return NextResponse.json(fallback);

  const { data, error } = await supabase.from('server_config').select('*').eq('id', true).maybeSingle();
  if (error || !data) return NextResponse.json(fallback);

  return NextResponse.json(toClient(data));
}

export async function POST(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const result = validate(body?.ip, body?.port);
  if (result.error) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });

  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase tidak dikonfigurasi.' }, { status: 500 });

  const { data, error } = await supabase
    .from('server_config')
    .upsert({ id: true, ip: result.ip, port: result.port, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Gugurkan cache getServerConfig() — inilah yang membuat perubahan langsung
  // terlihat di seluruh situs tanpa perlu redeploy.
  revalidateTag(SERVER_CONFIG_TAG);

  return NextResponse.json({ ok: true, config: toClient(data) });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }

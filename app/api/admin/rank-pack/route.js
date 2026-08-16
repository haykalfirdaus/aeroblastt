import { NextResponse } from 'next/server';
import { isAuthenticated, isValidOrigin } from '@/api/_auth';
import { supabase } from '@/api/_supabase';

/*
 * Manifest resourcepack rank Aeroblast (aeroblastrank) yang "hidup".
 *
 * Isinya daftar item prefix (file, char, dataURL PNG, provider, desain) —
 * format yang sama dengan state pack di studio Texture Rank, jadi bisa
 * di-load balik untuk diedit lalu disimpan lagi. Zip Java/Bedrock dirakit
 * client-side dari manifest ini.
 *
 * Disimpan di Supabase Storage (bucket rank-packs) karena filesystem Vercel
 * read-only saat runtime. Baseline awal (isi javarank.zip lama) ditanam di
 * client sebagai src/data/rankPackBaseline.json — dipakai kalau manifest
 * belum pernah disimpan.
 */

const BUCKET = 'rank-packs';
const FILE = 'rank-pack.json';
const ZIPS = { java: 'javarank.zip', bedrock: 'bedrockrank.zip' };
const MAX_BYTES = 12 * 1024 * 1024;

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

export async function GET(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // ?zip=java|bedrock → unduh file zip aeroblastrank terbaru dari Storage
  const zipId = new URL(request.url).searchParams.get('zip');
  if (zipId) {
    const name = ZIPS[zipId];
    if (!name) return NextResponse.json({ ok: false, error: 'zip harus java atau bedrock' }, { status: 400 });
    const { data, error } = await supabase.storage.from(BUCKET).download(name);
    if (error || !data) return NextResponse.json({ ok: false, error: 'Belum ada zip tersimpan' }, { status: 404 });
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(FILE);
  if (error || !data) return NextResponse.json({ ok: true, items: null }); // belum pernah disimpan → client pakai baseline
  const text = await data.text();
  try {
    return NextResponse.json({ ok: true, items: JSON.parse(text) });
  } catch {
    return NextResponse.json({ ok: true, items: null });
  }
}

export async function POST(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let items;
  try { items = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  if (!Array.isArray(items) || !items.length) return NextResponse.json({ ok: false, error: 'items kosong' }, { status: 400 });

  // Validasi ringan + anti-dobel char/file
  const chars = new Set(), files = new Set();
  for (const it of items) {
    if (!it || typeof it.file !== 'string' || typeof it.char !== 'string' || typeof it.dataURL !== 'string'
      || !it.dataURL.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ ok: false, error: 'Format item tidak valid' }, { status: 400 });
    }
    if (chars.has(it.char)) return NextResponse.json({ ok: false, error: `Karakter dobel: ${it.file}` }, { status: 400 });
    if (files.has(it.file)) return NextResponse.json({ ok: false, error: `Nama file dobel: ${it.file}` }, { status: 400 });
    chars.add(it.char); files.add(it.file);
  }

  const body = JSON.stringify(items);
  if (body.length > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Manifest terlalu besar' }, { status: 400 });

  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) await supabase.storage.createBucket(BUCKET, { public: false });

  const { error } = await supabase.storage.from(BUCKET).upload(FILE, new Blob([body], { type: 'application/json' }), {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: items.length });
}

/*
 * PUT ?zip=java|bedrock — timpa file zip aeroblastrank di Storage.
 * Dipanggil client HANYA saat "Simpan Pack Terbaru" (bukan saat tombol
 * download, yang murni client-side).
 */
export async function PUT(request) {
  if (!isValidOrigin(request)) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const zipId = new URL(request.url).searchParams.get('zip');
  const name = ZIPS[zipId];
  if (!name) return NextResponse.json({ ok: false, error: 'zip harus java atau bedrock' }, { status: 400 });

  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Ukuran zip tidak valid' }, { status: 400 });
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) return NextResponse.json({ ok: false, error: 'Bukan file zip' }, { status: 400 });

  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) await supabase.storage.createBucket(BUCKET, { public: false });

  const { error } = await supabase.storage.from(BUCKET).upload(name, buf, {
    contentType: 'application/zip',
    upsert: true,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

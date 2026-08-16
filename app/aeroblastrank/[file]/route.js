import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { supabase } from '@/api/_supabase';

/*
 * /aeroblastrank/javarank.zip dan /aeroblastrank/bedrockrank.zip — file zip
 * resourcepack yang "isinya otomatis keganti": disajikan dari Supabase Storage
 * (ditimpa setiap admin klik "Simpan Pack Terbaru" di studio Texture Rank).
 * Kalau belum pernah disimpan, fallback ke baseline statis di aeroblastrank/.
 */

const ALLOWED = new Set(['javarank.zip', 'bedrockrank.zip']);

export async function GET(request, { params }) {
  const { file } = await params;
  if (!ALLOWED.has(file)) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  let body = null;
  if (supabase) {
    const { data } = await supabase.storage.from('rank-packs').download(file);
    if (data) body = new Uint8Array(await data.arrayBuffer());
  }
  if (!body) {
    try {
      body = new Uint8Array(await readFile(path.join(process.cwd(), 'aeroblastrank', file)));
    } catch {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'no-store',
    },
  });
}

import { NextResponse } from 'next/server';
import { rateLimit } from '@/api/_ratelimit';

const VOTERS_API_KEY = process.env.VOTERS_API_KEY;
const SERVER_ID = 'aeroblast.my.id:25543';

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(ip, { max: 10, windowMs: 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ error: 'Terlalu banyak request.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  if (!VOTERS_API_KEY) {
    return NextResponse.json({ error: 'Server misconfigured: VOTERS_API_KEY not set' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 100);

  try {
    const url = `https://minecraft-mp.com/api/?object=servers&element=voters&key=${VOTERS_API_KEY}&month=current&limit=${limit}&format=json`;
    const upstream = await fetch(url, { next: { revalidate: 300 } });
    if (!upstream.ok) throw new Error(`Upstream HTTP ${upstream.status}`);
    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch voter data', detail: err.message }, { status: 502 });
  }
}

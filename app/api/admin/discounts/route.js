import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/api/_auth';
import { supabase } from '@/api/_supabase';

function toClient(row) {
  return { id: row.id, code: row.code, percent: row.percent, categories: row.categories, expiresAt: row.expires_at, createdAt: row.created_at };
}

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

export async function GET(request) {
  const adminView = await isAuthenticated(makeReq(request));
  let query = supabase.from('discounts').select('*').order('created_at', { ascending: false });
  if (!adminView) query = query.gt('expires_at', new Date().toISOString());
  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json(data.map(toClient));
}

export async function POST(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const { code, percent, categories, durationMinutes } = body || {};
  if (!code?.trim() || !/^[A-Z0-9_-]{1,32}$/.test(code.trim().toUpperCase())) return NextResponse.json({ ok: false, error: 'code tidak valid' }, { status: 400 });
  const percentNum = Number(percent);
  if (!percent || isNaN(percentNum) || percentNum <= 0 || percentNum > 100) return NextResponse.json({ ok: false, error: 'percent harus 1-100' }, { status: 400 });
  if (!Array.isArray(categories) || categories.length === 0) return NextResponse.json({ ok: false, error: 'categories tidak valid' }, { status: 400 });

  const { data: existing } = await supabase.from('discounts').select('id').ilike('code', code.trim()).maybeSingle();
  if (existing) return NextResponse.json({ ok: false, error: 'Kode diskon sudah ada' }, { status: 409 });

  const expiresAt = durationMinutes && Number(durationMinutes) > 0
    ? new Date(Date.now() + Number(durationMinutes) * 60 * 1000).toISOString()
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase.from('discounts').insert({ id: crypto.randomUUID(), code: code.trim().toUpperCase(), percent: percentNum, categories: categories.map(String).slice(0, 10), expires_at: expiresAt }).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, discount: toClient(data) }, { status: 201 });
}

export async function DELETE(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id diperlukan' }, { status: 400 });

  const { error } = await supabase.from('discounts').delete().eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }

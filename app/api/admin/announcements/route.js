import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/api/_auth';
import { supabase } from '@/api/_supabase';

function toClient(row) {
  return { id: row.id, text: row.text, expiresAt: row.expires_at, createdAt: row.created_at };
}

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

export async function GET() {
  const { data, error } = await supabase.from('announcements').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json(data.map(toClient));
}

export async function POST(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const { text, durationMinutes } = body || {};
  if (!text?.trim() || text.trim().length > 500) return NextResponse.json({ ok: false, error: 'text tidak valid (max 500 karakter)' }, { status: 400 });

  const expiresAt = durationMinutes && Number(durationMinutes) > 0
    ? new Date(Date.now() + Number(durationMinutes) * 60 * 1000).toISOString()
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase.from('announcements').insert({ id: crypto.randomUUID(), text: text.trim(), expires_at: expiresAt }).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, announcement: toClient(data) }, { status: 201 });
}

export async function DELETE(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id diperlukan' }, { status: 400 });

  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }

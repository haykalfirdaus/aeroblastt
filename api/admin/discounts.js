import crypto from 'crypto';
import { isAuthenticated, setCorsHeaders } from '../_auth.js';
import { supabase } from '../_supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res, 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GET — admin: semua (termasuk expired); publik: hanya non-expired
  if (req.method === 'GET') {
    const adminView = await isAuthenticated(req);
    let query = supabase.from('discounts').select('*').order('created_at', { ascending: false });
    if (!adminView) {
      query = query.gt('expires_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }

    res.status(200).json(data.map(toClient));
    return;
  }

  // POST — admin only
  if (req.method === 'POST') {
    if (!await isAuthenticated(req)) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); }
      catch { res.status(400).json({ ok: false, error: 'Invalid JSON body' }); return; }
    }

    const { code, percent, categories, durationMinutes } = body || {};

    if (!code || typeof code !== 'string' || code.trim() === '') {
      res.status(400).json({ ok: false, error: 'code is required' });
      return;
    }
    if (!/^[A-Z0-9_-]{1,32}$/.test(code.trim().toUpperCase())) {
      res.status(400).json({ ok: false, error: 'code hanya boleh huruf kapital, angka, - dan _' });
      return;
    }
    const percentNum = Number(percent);
    if (!percent || isNaN(percentNum) || percentNum <= 0 || percentNum > 100) {
      res.status(400).json({ ok: false, error: 'percent harus antara 1-100' });
      return;
    }
    if (!Array.isArray(categories) || categories.length === 0) {
      res.status(400).json({ ok: false, error: 'categories harus array tidak kosong' });
      return;
    }

    // Cek duplikat kode
    const { data: existing } = await supabase
      .from('discounts')
      .select('id')
      .ilike('code', code.trim())
      .maybeSingle();

    if (existing) {
      res.status(409).json({ ok: false, error: 'Kode diskon sudah ada' });
      return;
    }

    const now = new Date();
    const expiresAt = durationMinutes && Number(durationMinutes) > 0
      ? new Date(now.getTime() + Number(durationMinutes) * 60 * 1000).toISOString()
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('discounts')
      .insert({
        id: crypto.randomUUID(),
        code: code.trim().toUpperCase(),
        percent: percentNum,
        categories: categories.map(String).slice(0, 10),
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }

    res.status(201).json({ ok: true, discount: toClient(data) });
    return;
  }

  // DELETE — admin only
  if (req.method === 'DELETE') {
    if (!await isAuthenticated(req)) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }

    const id = req.query?.id || new URL(req.url, 'http://localhost').searchParams.get('id');
    if (!id) {
      res.status(400).json({ ok: false, error: 'id is required' });
      return;
    }

    const { error } = await supabase.from('discounts').delete().eq('id', id);
    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}

function toClient(row) {
  return {
    id: row.id,
    code: row.code,
    percent: row.percent,
    categories: row.categories,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

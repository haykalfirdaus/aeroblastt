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

  // GET — public, return only non-expired rows
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

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

    const { text, durationMinutes } = body || {};
    if (!text || typeof text !== 'string' || text.trim() === '') {
      res.status(400).json({ ok: false, error: 'text is required' });
      return;
    }
    if (text.trim().length > 500) {
      res.status(400).json({ ok: false, error: 'text max 500 characters' });
      return;
    }

    const now = new Date();
    const expiresAt = durationMinutes && Number(durationMinutes) > 0
      ? new Date(now.getTime() + Number(durationMinutes) * 60 * 1000).toISOString()
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(); // default 1 tahun

    const { data, error } = await supabase
      .from('announcements')
      .insert({ id: crypto.randomUUID(), text: text.trim(), expires_at: expiresAt })
      .select()
      .single();

    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }

    res.status(201).json({ ok: true, announcement: toClient(data) });
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

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
}

// Map snake_case DB columns → camelCase client shape
function toClient(row) {
  return {
    id: row.id,
    text: row.text,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Service role client — server-side only, bypasses RLS
// Null at build time if env vars not yet available (avoid throw during next build)
export const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// Anon client — used only to verify JWT from Supabase Auth (admin sessions)
export const supabaseAuth = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

// Use this guard in route handlers so they fail gracefully at runtime
export function requireSupabase() {
  if (!supabase) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak dikonfigurasi');
  return supabase;
}

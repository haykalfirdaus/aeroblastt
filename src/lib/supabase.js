import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Export null if env vars missing — AuthContext handles null gracefully.
// Store and public pages still work; only admin login requires these vars.
export const supabase = (url && key)
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

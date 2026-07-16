import { createContext, use, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cek session dari HttpOnly cookie via server
  const verify = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/session', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setIsAdmin(data.authenticated === true);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  // Login: Supabase client auth → tukar token ke HttpOnly cookie via server
  const login = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ke env vars.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Login gagal. Periksa kembali kredensial Anda.');

    const res = await fetch('/api/admin/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: data.session.access_token }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Gagal menyimpan session');
    }
    setIsAdmin(true);
  }, []);

  // Logout: hapus HttpOnly cookie + sign out dari Supabase
  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/session', { method: 'DELETE', credentials: 'include' });
      if (supabase) await supabase.auth.signOut();
    } finally {
      setIsAdmin(false);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext value={{ isAdmin, loading, login, logout, verify }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

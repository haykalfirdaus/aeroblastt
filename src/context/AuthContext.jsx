'use client';
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

  // Login sepenuhnya server-side — kredensial + token Turnstile dikirim ke
  // /api/admin/session yang me-rate-limit tiap percobaan dan memverifikasi
  // Turnstile (siteverify) sebelum menyentuh Supabase. Browser tidak pernah
  // memanggil Supabase Auth langsung, jadi brute force tak bisa bypass limiter.
  const login = useCallback(async (email, password, turnstileToken) => {
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, turnstileToken }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.ok) throw new Error(d.error || 'Login gagal. Periksa kembali kredensial Anda.');
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

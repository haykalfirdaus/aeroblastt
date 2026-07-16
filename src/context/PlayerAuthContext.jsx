'use client';
import { createContext, use, useCallback, useEffect, useState } from 'react';

const PlayerAuthContext = createContext(null);

export function PlayerAuthProvider({ children }) {
  const [nick, setNick] = useState(null);
  const [loading, setLoading] = useState(true);

  const verify = useCallback(async () => {
    try {
      const res = await fetch('/api/player', { credentials: 'include' });
      const data = await res.json();
      setNick(data.ok ? data.nick : null);
    } catch {
      setNick(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { verify(); }, [verify]);

  async function login(username) {
    const res = await fetch('/api/player', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', nick: username }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Login gagal');
    setNick(data.nick);
    return data.nick;
  }

  async function logout() {
    await fetch('/api/player', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setNick(null);
  }

  return (
    <PlayerAuthContext value={{ nick, loading, login, logout }}>
      {children}
    </PlayerAuthContext>
  );
}

export function usePlayerAuth() {
  const ctx = use(PlayerAuthContext);
  if (!ctx) throw new Error('usePlayerAuth harus dipakai di dalam PlayerAuthProvider');
  return ctx;
}

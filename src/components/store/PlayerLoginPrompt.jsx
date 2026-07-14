import { useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

export function PlayerLoginPrompt() {
  const { nick, loading, login, logout } = usePlayerAuth();
  const showToast = useToast();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    try {
      const logged = await login(input.trim());
      showToast(`Berhasil login sebagai ${logged}`, 'success');
      setInput('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    showToast('Berhasil logout', 'success');
  }

  if (loading) return null;

  if (nick) {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-neon-500/20 bg-neon-500/[0.06] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-500/30 bg-neon-500/10">
            <User size={15} className="text-neon-400" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] text-text-dim">Login sebagai</p>
            <p className="font-mono text-sm font-bold text-text-bright">{nick}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-text-dim transition-colors hover:border-white/20 hover:text-text-bright"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-warning/20 bg-warning/[0.04] px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-text-bright">
        Login dengan username Minecraft kamu untuk melakukan order
      </p>
      <p className="mb-3 text-xs text-text-dim">
        Username harus sudah pernah join server AeroBlast dan terdaftar di NLogin.
      </p>
      <form onSubmit={handleLogin} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Username Minecraft kamu…"
          maxLength={16}
          disabled={submitting}
          className={cn(
            'flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors',
            'focus:border-neon-400/60 focus:bg-white/[0.06] disabled:opacity-50',
          )}
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          className="flex items-center gap-1.5 rounded-xl border border-neon-500/40 bg-neon-500/15 px-4 py-2.5 text-sm font-semibold text-neon-300 transition-colors hover:bg-neon-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neon-400/30 border-t-neon-400" />
            : <LogIn size={14} />}
          Masuk
        </button>
      </form>
    </div>
  );
}

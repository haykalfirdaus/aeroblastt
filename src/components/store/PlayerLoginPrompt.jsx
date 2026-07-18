import { useState } from 'react';
import { LogIn, LogOut, RefreshCw, Smartphone, User } from 'lucide-react';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { usePlayerRank } from '@/hooks/usePlayerRank';
import { RANKS } from '@/data/ranks';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

// Nick dengan titik = Bedrock (format NLogin: .NamaBedrock)
function isBedrock(nick) {
  return nick.includes('.');
}

export function PlayerLoginPrompt() {
  const { nick, loading, login, logout } = usePlayerAuth();
  const { rank, loading: rankLoading } = usePlayerRank();
  const rankMeta = rank ? RANKS.find((r) => r.key === rank) : null;
  const showToast = useToast();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasDot = input.includes('.');

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
    const bedrock = isBedrock(nick);
    return (
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#B4E035]/25 bg-[#B4E035]/[0.07] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#B4E035]/35 bg-[#B4E035]/15">
            {bedrock ? <Smartphone size={15} className="text-[#566947]" /> : <User size={15} className="text-[#748F1C]" />}
          </div>
          <div className="leading-tight">
            <p className="text-[11px] text-[#6B7F5A]">
              Login sebagai
              {bedrock && <span className="ml-1.5 rounded-full bg-[#6B7F5A]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#566947]">BEDROCK</span>}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="font-mono text-sm font-bold text-[#1A2E1A]">{nick}</p>
              {rankLoading && <RefreshCw size={10} className="animate-spin text-[#8A9E7A]" />}
              {!rankLoading && rankMeta && (
                <span
                  className="rounded-full border px-1.5 py-0.5 text-[0.6rem] font-bold"
                  style={{
                    borderColor: `color-mix(in srgb, var(--color-${rankMeta.accent}) 40%, transparent)`,
                    backgroundColor: `color-mix(in srgb, var(--color-${rankMeta.accent}) 12%, transparent)`,
                    color: `var(--color-${rankMeta.accent})`,
                  }}
                >
                  {rankMeta.name.toUpperCase()}
                </span>
              )}
              {!rankLoading && !rankMeta && (
                <span className="rounded-full border border-[#D8D1C0] bg-[#F0EBE0] px-1.5 py-0.5 text-[0.6rem] font-bold text-[#8A9E7A]">
                  MEMBER
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-[#D8D1C0] bg-[#FAFAF7] px-3 py-1.5 text-xs font-semibold text-[#6B7F5A] transition-colors hover:border-[#B4E035]/30 hover:text-[#1A2E1A]"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-warning/20 bg-warning/[0.04] px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-[#1A2E1A]">
        Login dengan username Minecraft kamu untuk melakukan order
      </p>
      <p className="mb-3 text-xs text-[#6B7F5A]">
        Username harus sudah pernah join server AeroBlast dan terdaftar di NLogin.
        {' '}Bedrock: username biasanya mengandung titik (contoh: <span className="font-mono text-[#4A5E3E]">.NamaKamu</span>).
      </p>
      {hasDot && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#6B7F5A]/30 bg-[#6B7F5A]/8 px-3 py-2 text-xs text-[#566947]">
          <Smartphone size={13} />
          Username mengandung titik — akan dikenali sebagai <strong className="ml-1">Bedrock / PE</strong>
        </div>
      )}
      <form onSubmit={handleLogin} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Username Minecraft kamu…"
          maxLength={30}
          disabled={submitting}
          className={cn(
            'flex-1 rounded-xl border border-[#D8D1C0] bg-[#FAFAF7] px-4 py-2.5 text-sm text-[#1A2E1A] placeholder:text-[#8A9E7A] outline-none transition-colors',
            'focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/20 disabled:opacity-50',
          )}
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          className="flex items-center gap-1.5 rounded-xl border border-[#B4E035]/50 bg-[#B4E035]/15 px-4 py-2.5 text-sm font-semibold text-[#748F1C] transition-colors hover:bg-[#B4E035]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#B4E035]/30 border-t-[#B4E035]" />
            : <LogIn size={14} />}
          Masuk
        </button>
      </form>
    </div>
  );
}

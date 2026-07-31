import { useState } from 'react';
import { LogIn, LogOut, RefreshCw, Smartphone, User, AlertTriangle } from 'lucide-react';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { usePlayerRank } from '@/hooks/usePlayerRank';
import { RANKS } from '@/data/ranks';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

// Deteksi platform: nick dengan awalan titik = Bedrock (format NLogin: .NamaBedrock),
// tanpa awalan titik = Java.
function isBedrock(nick) {
  return nick.trim().startsWith('.');
}

// Pesan error tegas untuk username salah / tidak ditemukan. Sengaja menegaskan
// aturan awalan titik agar pemain Bedrock langsung tahu penyebab umum kegagalan.
const INVALID_USERNAME_MSG =
  'Username salah atau tidak ditemukan. Pastikan Anda menggunakan awalan titik (.) di awal nama jika Anda adalah pemain Bedrock.';

// Error yang berasal dari infrastruktur (bukan salah ketik nick) tetap ditampilkan apa adanya.
function isInfraError(message) {
  return /terlalu banyak|database|terhubung|coba lagi/i.test(message || '');
}

export function PlayerLoginPrompt() {
  const { nick, loading, login, logout } = usePlayerAuth();
  const { rank, loading: rankLoading } = usePlayerRank();
  const rankMeta = rank ? RANKS.find((r) => r.key === rank) : null;
  const showToast = useToast();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const trimmed = input.trim();
  const bedrockInput = isBedrock(input);

  function handleChange(e) {
    setInput(e.target.value);
    if (error) setError('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const logged = await login(trimmed);
      showToast(`Berhasil login sebagai ${logged}`, 'success');
      setInput('');
    } catch (err) {
      const msg = isInfraError(err.message) ? err.message : INVALID_USERNAME_MSG;
      setError(msg);
      showToast(msg, 'error');
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
      <div className="mb-6 flex items-center justify-between gap-4 rounded-md border border-[#BFFF5E]/25 bg-[#BFFF5E]/[0.07] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#BFFF5E]/35 bg-[#BFFF5E]/15">
            {bedrock ? <Smartphone size={15} className="text-[#354530]" /> : <User size={15} className="text-[#1d2b1f]" />}
          </div>
          <div className="leading-tight">
            <p className="text-[11px] text-[#4a5e3a]">
              Login sebagai
              {bedrock && <span className="ml-1.5 rounded-md bg-[#4a5e3a]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#354530]">BEDROCK</span>}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="font-mono text-sm font-bold text-[#1d2b1f]">{nick}</p>
              {rankLoading && <RefreshCw size={10} className="animate-spin text-[#6b7f5a]" />}
              {!rankLoading && rankMeta && (
                <span
                  className="rounded-md border px-1.5 py-0.5 text-[0.6rem] font-bold"
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
                <span className="rounded-md border border-2 border-[#1d2b1f] bg-[#f5ece0] px-1.5 py-0.5 text-[0.6rem] font-bold text-[#6b7f5a]">
                  MEMBER
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-2 border-[#1d2b1f] bg-[#fffdf9] px-3 py-1.5 text-xs font-semibold text-[#4a5e3a] transition-colors hover:border-[#BFFF5E]/30 hover:text-[#1d2b1f]"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-[#1d2b1f]">
        Login dengan username Minecraft kamu untuk melakukan order
      </p>

      {/* Instruksi platform — TAMPIL sejak awal, sebelum user mengetik apa pun */}
      <div className="mb-3 grid gap-2 rounded-md border border-[#1d2b1f]/20 bg-[#fffdf9] px-3.5 py-3 sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#1d2b1f]/20 bg-[#BFFF5E]/12">
            <User size={13} className="text-[#1d2b1f]" />
          </span>
          <p className="text-[0.72rem] leading-relaxed text-[#4a5e3a]">
            <strong className="font-bold text-[#1d2b1f]">Java Edition</strong> — tulis username{' '}
            <span className="font-semibold">tanpa awalan titik</span>.
            <br />
            Contoh: <span className="font-mono text-[#1d2b1f]">NamaKamu</span>
          </p>
        </div>
        <div className="flex items-start gap-2 sm:border-l sm:border-[#1d2b1f]/12 sm:pl-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#1d2b1f]/20 bg-[#4a5e3a]/12">
            <Smartphone size={13} className="text-[#354530]" />
          </span>
          <p className="text-[0.72rem] leading-relaxed text-[#4a5e3a]">
            <strong className="font-bold text-[#1d2b1f]">Bedrock / PE</strong> — WAJIB pakai{' '}
            <span className="font-semibold">awalan titik (.)</span> di depan nama.
            <br />
            Contoh: <span className="font-mono text-[#1d2b1f]">.NamaKamu</span>
          </p>
        </div>
      </div>

      {/* Indikator platform live — mengikuti apa yang diketik user */}
      {trimmed && (
        <div
          className={cn(
            'mb-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium',
            bedrockInput
              ? 'border-[#4a5e3a]/35 bg-[#4a5e3a]/10 text-[#354530]'
              : 'border-[#BFFF5E]/45 bg-[#BFFF5E]/12 text-[#1d2b1f]'
          )}
        >
          {bedrockInput ? <Smartphone size={13} /> : <User size={13} />}
          Terdeteksi sebagai{' '}
          <strong className="font-bold">{bedrockInput ? 'Bedrock / PE' : 'Java Edition'}</strong>
        </div>
      )}

      <form onSubmit={handleLogin} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Username Minecraft kamu…"
          maxLength={30}
          disabled={submitting}
          aria-invalid={!!error}
          className={cn(
            'flex-1 rounded-md border border-2 bg-[#fffdf9] px-4 py-2.5 text-sm text-[#1d2b1f] placeholder:text-[#6b7f5a] outline-none transition-colors',
            'focus:ring-2 disabled:opacity-50',
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-[#1d2b1f] focus:border-[#BFFF5E]/70 focus:ring-[#BFFF5E]/20'
          )}
        />
        <button
          type="submit"
          disabled={submitting || !trimmed}
          className="flex items-center gap-1.5 rounded-md border border-[#BFFF5E]/50 bg-[#BFFF5E]/15 px-4 py-2.5 text-sm font-semibold text-[#1d2b1f] transition-colors hover:bg-[#BFFF5E]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? <span className="h-3.5 w-3.5 animate-spin rounded-md border-2 border-[#BFFF5E]/30 border-t-[#BFFF5E]" />
            : <LogIn size={14} />}
          Masuk
        </button>
      </form>

      {/* Pesan error tegas saat username salah / tidak ditemukan */}
      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-md border border-danger/45 bg-danger/[0.08] px-3.5 py-2.5 text-xs font-medium leading-relaxed text-[#a3271f]"
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text di bawah form */}
      <p className="mt-3 text-[0.72rem] leading-relaxed text-[#6b7f5a]">
        Username harus sudah pernah join server AeroBlast dan terdaftar di NLogin. Pemain Bedrock
        wajib menambahkan awalan titik (.) di awal nama — tanpa titik, akun tidak akan ditemukan.
      </p>
    </div>
  );
}

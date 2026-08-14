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
      <div className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-neu-lg)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 py-4 shadow-[var(--neu-out)]">
        <div className="flex items-center gap-3">
          <div className="neu-icon h-10 w-10 rounded-[13px]">
            {bedrock ? <Smartphone size={16} aria-hidden="true" className="text-[#354530]" /> : <User size={16} aria-hidden="true" className="text-[#1d2b1f]" />}
          </div>
          <div className="leading-tight">
            <p className="text-[11px] text-[#4a5e3a]">
              Login sebagai
              {bedrock && <span className="ml-1.5 rounded-full bg-[#fff8f0] px-2 py-0.5 text-[10px] font-bold text-[#354530] shadow-[var(--neu-in)]">BEDROCK</span>}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="font-mono text-sm font-bold text-[#1d2b1f]">{nick}</p>
              {rankLoading && <RefreshCw size={10} aria-hidden="true" className="animate-spin text-[#5a7048]" />}
              {!rankLoading && rankMeta && (
                <span
                  className="rounded-full bg-[#fff8f0] px-2 py-0.5 text-[0.6rem] font-bold shadow-[var(--neu-in)]"
                  style={{ color: `var(--color-${rankMeta.accent})` }}
                >
                  {rankMeta.name.toUpperCase()}
                </span>
              )}
              {!rankLoading && !rankMeta && (
                <span className="rounded-full bg-[#fff8f0] px-2 py-0.5 text-[0.6rem] font-bold text-[#5a7048] shadow-[var(--neu-in)]">
                  MEMBER
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="neu-press flex min-h-[48px] items-center gap-1.5 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-4 text-xs font-semibold text-[#4a5e3a] shadow-[var(--neu-out)]"
        >
          <LogOut size={12} aria-hidden="true" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 py-5 shadow-[var(--neu-out-lg)]">
      <p className="mb-3 text-sm font-semibold text-[#1d2b1f]">
        Login dengan username Minecraft kamu untuk melakukan order
      </p>

      {/* Instruksi platform — TAMPIL sejak awal, sebelum user mengetik apa pun */}
      <div className="mb-3 grid gap-3 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-4 shadow-[var(--neu-in)] sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <span className="neu-icon mt-0.5 h-8 w-8 rounded-[11px]">
            <User size={14} aria-hidden="true" className="text-[#1d2b1f]" />
          </span>
          <p className="text-[0.72rem] leading-relaxed text-[#4a5e3a]">
            <strong className="font-bold text-[#1d2b1f]">Java Edition</strong> — tulis username{' '}
            <span className="font-semibold">tanpa awalan titik</span>.
            <br />
            Contoh: <span className="font-mono text-[#1d2b1f]">NamaKamu</span>
          </p>
        </div>
        <div className="flex items-start gap-2.5 sm:pl-3">
          <span className="neu-icon mt-0.5 h-8 w-8 rounded-[11px]">
            <Smartphone size={14} aria-hidden="true" className="text-[#354530]" />
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
            'mb-3 inline-flex items-center gap-2 rounded-full bg-[#fff8f0] px-3.5 py-2 text-xs font-medium shadow-[var(--neu-in)]',
            bedrockInput ? 'text-[#354530]' : 'text-[#1d2b1f]'
          )}
        >
          {bedrockInput ? <Smartphone size={13} aria-hidden="true" /> : <User size={13} aria-hidden="true" />}
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
          className={cn('neu-field flex-1 text-sm disabled:opacity-50', error && 'text-[#a3271f]')}
        />
        <button
          type="submit"
          disabled={submitting || !trimmed}
          className="neu-press flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 text-sm font-semibold text-[#1d2b1f] shadow-[var(--neu-out)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#d8cfc0] border-t-[#4a5e3a]" />
            : <LogIn size={14} aria-hidden="true" />}
          Masuk
        </button>
      </form>

      {/* Pesan error tegas saat username salah / tidak ditemukan */}
      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 py-3 text-xs font-medium leading-relaxed text-[#a3271f] shadow-[var(--neu-in)]"
        >
          <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[#a3271f]" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper text di bawah form */}
      <p className="mt-3 text-[0.72rem] leading-relaxed text-[#5a7048]">
        Username harus sudah pernah join server AeroBlast dan terdaftar di NLogin. Pemain Bedrock
        wajib menambahkan awalan titik (.) di awal nama — tanpa titik, akun tidak akan ditemukan.
      </p>
    </div>
  );
}

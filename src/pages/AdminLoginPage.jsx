import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60 focus:bg-white/[0.06]';

// ---------------------------------------------------------------------------
// Countdown hook — returns seconds remaining from a start timestamp
// ---------------------------------------------------------------------------
function useCountdown(startedAt, durationMs) {
  const [remaining, setRemaining] = useState(() =>
    startedAt ? Math.max(0, Math.floor((startedAt + durationMs - Date.now()) / 1000)) : 0
  );

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((startedAt + durationMs - Date.now()) / 1000));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMs]);

  return remaining;
}

// ---------------------------------------------------------------------------
// View: Login
// ---------------------------------------------------------------------------
function LoginView({ onForgot }) {
  const { login } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      showToast('Login berhasil. Selamat datang!', 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      showToast(err.message || 'Login gagal.', 'error');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn('relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]', shake && 'animate-shake')}>
      <GlowLine />
      <form onSubmit={handleSubmit} className="p-7 pt-8">
        <h2 className="mb-6 font-display text-lg font-semibold text-text-bright">
          Masuk ke Panel Admin
        </h2>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Username</label>
          <input
            type="text"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className={fieldBase}
            disabled={submitting}
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(fieldBase, 'pr-12')}
              disabled={submitting}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim transition-colors hover:text-text-bright"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" size="md" fullWidth disabled={submitting || !username.trim() || !password}>
          {submitting ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Memverifikasi…</>
          ) : 'Masuk'}
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-text-dim transition-colors hover:text-neon-300"
          >
            Lupa password?
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: Forgot (request OTP)
// ---------------------------------------------------------------------------
function ForgotView({ onBack, onSent }) {
  const showToast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim kode');
      onSent(data.token);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
      <GlowLine />
      <div className="p-7 pt-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-text-bright"
        >
          <ArrowLeft size={13} /> Kembali ke Login
        </button>

        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-neon-500/25 bg-neon-500/10">
          <KeyRound size={20} className="text-neon-400" />
        </div>

        <h2 className="mb-1 font-display text-lg font-semibold text-text-bright">Reset Akses Admin</h2>
        <p className="mb-6 text-sm text-text-dim">
          Klik tombol di bawah — kode 6 digit akan dikirim ke perangkat admin.
        </p>

        <Button variant="primary" size="md" fullWidth disabled={submitting} onClick={handleSend}>
          {submitting ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Mengirim…</>
          ) : 'Kirim Kode'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: OTP verification
// ---------------------------------------------------------------------------
const OTP_DURATION = 5 * 60 * 1000;

function OtpView({ token, onBack, onResend, onUnlocked }) {
  const showToast = useToast();
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const sentAt = useRef(Date.now());
  const remaining = useCountdown(sentAt.current, OTP_DURATION);

  const expired = remaining === 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  async function handleVerify(e) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kode tidak valid');
      // Blokir login dicabut — kembali ke form login, bukan langsung masuk
      showToast('Blokir dicabut. Silakan login dengan password kamu.', 'success');
      onUnlocked();
    } catch (err) {
      showToast(err.message, 'error');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn('relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]', shake && 'animate-shake')}>
      <GlowLine />
      <form onSubmit={handleVerify} className="p-7 pt-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-xs text-text-dim transition-colors hover:text-text-bright"
        >
          <ArrowLeft size={13} /> Kembali
        </button>

        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-neon-500/25 bg-neon-500/10">
          <KeyRound size={20} className="text-neon-400" />
        </div>

        <h2 className="mb-1 font-display text-lg font-semibold text-text-bright">Masukkan Kode OTP</h2>
        <p className="mb-6 text-sm text-text-dim">
          Kode telah dikirim ke email admin. Masukkan kode untuk mencabut blokir login. Kode berlaku 5 menit.
        </p>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            Kode 6 Digit
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            disabled={submitting || expired}
            className={cn(
              fieldBase,
              'text-center font-mono text-2xl tracking-[0.5em]',
              expired && 'opacity-40'
            )}
          />
        </div>

        {/* Countdown */}
        <div className="mb-5 flex items-center justify-between">
          {!expired ? (
            <span className="text-xs text-text-dim">
              Kedaluwarsa dalam{' '}
              <span className={cn('font-mono font-semibold', remaining <= 60 ? 'text-danger/80' : 'text-neon-300')}>
                {mm}:{ss}
              </span>
            </span>
          ) : (
            <span className="text-xs text-danger/80">Kode kedaluwarsa</span>
          )}
          {expired && (
            <button
              type="button"
              onClick={onResend}
              className="text-xs font-semibold text-neon-400 transition-colors hover:text-neon-300"
            >
              Kirim ulang kode
            </button>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={submitting || otp.length !== 6 || expired}
        >
          {submitting ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Memverifikasi…</>
          ) : 'Verifikasi & Cabut Blokir'}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared decorative element
// ---------------------------------------------------------------------------
function GlowLine() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-px opacity-60"
      style={{ background: 'linear-gradient(90deg, transparent, var(--color-neon-500), transparent)' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------
export default function AdminLoginPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // 'login' | 'forgot' | 'otp'
  const [view, setView] = useState('login');
  const [otpToken, setOtpToken] = useState(null);

  useEffect(() => {
    if (!loading && isAdmin) navigate('/admin', { replace: true });
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-500/20 border-t-neon-400" />
      </div>
    );
  }

  function handleOtpSent(token) {
    setOtpToken(token);
    setView('otp');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <div className="bg-app" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(50% 40% at 50% 20%, rgba(37,99,235,0.14) 0%, transparent 65%)' }}
      />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-500/30 bg-neon-500/10 shadow-[0_0_32px_rgba(59,130,246,0.18)]" aria-hidden="true">
            <Shield size={30} className="text-neon-400" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-bright">
              AeroBlast
              <span className="ml-2 text-gradient bg-gradient-to-r from-neon-400 to-cyan-400">Admin</span>
            </h1>
            <p className="mt-0.5 text-xs text-text-dim">Panel Administrasi · Akses Terbatas</p>
          </div>
        </div>

        {view === 'login' && (
          <LoginView onForgot={() => setView('forgot')} />
        )}
        {view === 'forgot' && (
          <ForgotView onBack={() => setView('login')} onSent={handleOtpSent} />
        )}
        {view === 'otp' && (
          <OtpView
            token={otpToken}
            onBack={() => setView('forgot')}
            onResend={() => { setOtpToken(null); setView('forgot'); }}
            onUnlocked={() => { setOtpToken(null); setView('login'); }}
          />
        )}

        <p className="mt-6 text-xs text-text-faint">
          AeroBlast &copy; {new Date().getFullYear()} &mdash; Hanya untuk staf resmi
        </p>
      </main>
    </div>
  );
}

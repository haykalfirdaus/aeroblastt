'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, KeyRound, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60 focus:bg-white/[0.06]';

// ---------------------------------------------------------------------------
// Decorative element
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
// View: Login
// ---------------------------------------------------------------------------
function LoginView({ onForgot }) {
  const { login } = useAuth();
  const showToast = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      showToast('Login berhasil. Selamat datang!', 'success');
      router.replace('/admin');
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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Email</label>
          <input
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@aeroblast.id"
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

        <Button type="submit" variant="primary" size="md" fullWidth disabled={submitting || !email.trim() || !password}>
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
// View: Forgot password — kirim reset link via Supabase
// ---------------------------------------------------------------------------
function ForgotView({ onBack }) {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim link reset');
      setSent(true);
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

        {sent ? (
          <>
            <h2 className="mb-1 font-display text-lg font-semibold text-text-bright">Link Terkirim</h2>
            <p className="mb-6 text-sm text-text-dim">
              Cek email <span className="font-semibold text-text-bright">{email}</span> untuk link reset password. Link berlaku 1 jam.
            </p>
            <Button variant="ghost" size="md" fullWidth onClick={onBack}>Kembali ke Login</Button>
          </>
        ) : (
          <>
            <h2 className="mb-1 font-display text-lg font-semibold text-text-bright">Reset Password</h2>
            <p className="mb-6 text-sm text-text-dim">
              Masukkan email admin — link reset akan dikirim ke email tersebut.
            </p>
            <form onSubmit={handleSend} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Email Admin</label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aeroblast.id"
                  className={fieldBase}
                  disabled={submitting}
                />
              </div>
              <Button type="submit" variant="primary" size="md" fullWidth disabled={submitting || !email.trim()}>
                {submitting ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Mengirim…</>
                ) : 'Kirim Link Reset'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: Reset Password — handle callback dari email Supabase
// ---------------------------------------------------------------------------
function ResetPasswordView({ onDone }) {
  const showToast = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    if (password.length < 8) {
      showToast('Password minimal 8 karakter', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ke env vars.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message || 'Gagal mengubah password');
      showToast('Password berhasil diubah! Silakan login.', 'success');
      onDone();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
      <GlowLine />
      <form onSubmit={handleReset} className="p-7 pt-8">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-neon-500/25 bg-neon-500/10">
          <KeyRound size={20} className="text-neon-400" />
        </div>
        <h2 className="mb-1 font-display text-lg font-semibold text-text-bright">Buat Password Baru</h2>
        <p className="mb-6 text-sm text-text-dim">Masukkan password baru untuk akun admin.</p>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Password Baru</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className={cn(fieldBase, 'pr-12')}
              disabled={submitting}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim transition-colors hover:text-text-bright"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" variant="primary" size="md" fullWidth disabled={submitting || password.length < 8}>
          {submitting ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan…</>
          ) : 'Simpan Password Baru'}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------
export default function AdminLoginPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  // 'login' | 'forgot' | 'reset'
  const [view, setView] = useState('login');

  // Deteksi callback reset password dari Supabase (hash #reset + ada session di URL)
  useEffect(() => {
    if (window.location.hash === '#reset') {
      setView('reset');
      // Bersihkan hash dari URL tanpa reload
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAdmin) router.replace('/admin');
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-500/20 border-t-neon-400" />
      </div>
    );
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

        {view === 'login' && <LoginView onForgot={() => setView('forgot')} />}
        {view === 'forgot' && <ForgotView onBack={() => setView('login')} />}
        {view === 'reset' && <ResetPasswordView onDone={() => setView('login')} />}

        <p className="mt-6 text-xs text-text-faint">
          AeroBlast &copy; {new Date().getFullYear()} &mdash; Hanya untuk staf resmi
        </p>
      </main>
    </div>
  );
}

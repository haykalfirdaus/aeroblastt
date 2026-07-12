import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export default function AdminLoginPage() {
  const { isAdmin, loading, login } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

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

  const fieldBase =
    'w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60 focus:bg-white/[0.06]';

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-500/20 border-t-neon-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      {/* Background grid shell */}
      <div className="bg-app" aria-hidden="true" />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 40% at 50% 20%, rgba(37,99,235,0.14) 0%, transparent 65%)',
        }}
      />

      {/* Centered card */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Logo + branding */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-500/30 bg-neon-500/10 shadow-[0_0_32px_rgba(59,130,246,0.18)]"
            aria-hidden="true"
          >
            <Shield size={30} className="text-neon-400" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-text-bright">
              AeroBlast
              <span className="ml-2 text-gradient bg-gradient-to-r from-neon-400 to-cyan-400">
                Admin
              </span>
            </h1>
            <p className="mt-0.5 text-xs text-text-dim">Panel Administrasi · Akses Terbatas</p>
          </div>
        </div>

        {/* Glass card */}
        <div
          className={cn(
            'relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]',
            'shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]',
            shake && 'animate-shake'
          )}
        >
          {/* Top glow line */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px opacity-60"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-neon-500), transparent)',
            }}
          />

          <form onSubmit={handleSubmit} className="p-7 pt-8">
            <h2 className="mb-6 font-display text-lg font-semibold text-text-bright">
              Masuk ke Panel Admin
            </h2>

            {/* Username */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Username
              </label>
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

            {/* Password */}
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Password
              </label>
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim transition-colors hover:text-text-bright focus-visible:text-text-bright"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={submitting || !username.trim() || !password}
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memverifikasi…
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-xs text-text-faint">
          AeroBlast &copy; {new Date().getFullYear()} &mdash; Hanya untuk staf resmi
        </p>
      </div>
    </div>
  );
}

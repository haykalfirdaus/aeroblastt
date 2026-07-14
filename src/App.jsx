import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerAuthProvider } from '@/context/PlayerAuthContext';
import { scrollToId } from '@/lib/motion';
import { onDevtoolsChange } from '@/utils/devtools-protection';

const HomePage         = lazy(() => import('@/pages/HomePage'));
const StorePage        = lazy(() => import('@/pages/StorePage'));
const TopVotersPage    = lazy(() => import('@/pages/TopVotersPage'));
const FaqPage          = lazy(() => import('@/pages/FaqPage'));
const TermsPage        = lazy(() => import('@/pages/TermsPage'));
const NotFoundPage     = lazy(() => import('@/pages/NotFoundPage'));
const AdminLoginPage   = lazy(() => import('@/pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Let the lazy page mount, then glide to the requested section.
      const id = hash.slice(1);
      const t = setTimeout(() => scrollToId(id), 90);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
  return null;
}

function PageLoader() {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-void">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-500/20 border-t-neon-400" />
        <span className="font-mono text-xs text-text-dim">Memuat...</span>
      </div>
    </div>
  );
}

function DevtoolsWarningOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onDevtoolsChange(setOpen);
    return unsubscribe;
  }, []);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(3,7,17,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {/* Glow ring */}
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        border: '2px solid rgba(239,68,68,0.4)',
        boxShadow: '0 0 40px rgba(239,68,68,0.25), inset 0 0 40px rgba(239,68,68,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
        background: 'rgba(239,68,68,0.06)',
      }}>
        <span style={{ fontSize: 38 }}>⛔</span>
      </div>

      <h1 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
        fontWeight: 800,
        color: '#f1f5f9',
        marginBottom: '0.75rem',
        letterSpacing: '-0.02em',
      }}>
        Akses Tidak Diizinkan
      </h1>

      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.95rem',
        color: '#8ea0b8',
        maxWidth: 380,
        lineHeight: 1.7,
        marginBottom: '1.5rem',
      }}>
        Developer Tools terdeteksi terbuka. Tutup DevTools untuk melanjutkan menggunakan situs ini.
      </p>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: 8,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#fca5a5',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem',
        letterSpacing: '0.05em',
      }}>
        <span style={{ opacity: 0.6 }}>Tekan</span>
        <kbd style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4,
          padding: '1px 6px',
          fontSize: '0.7rem',
        }}>F12</kbd>
        <span style={{ opacity: 0.6 }}>untuk menutup DevTools</span>
      </div>

      <p style={{
        marginTop: '2rem',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.7rem',
        color: '#435268',
      }}>
        AeroBlast Security &mdash; Unauthorized access is monitored
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PlayerAuthProvider>
          <DevtoolsWarningOverlay />
          <ScrollManager />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"              element={<HomePage />} />
              <Route path="/store"         element={<StorePage />} />
              <Route path="/top-voters"    element={<TopVotersPage />} />
              <Route path="/faq"           element={<FaqPage />} />
              <Route path="/terms"         element={<TermsPage />} />
              <Route path="/admin/login"   element={<AdminLoginPage />} />
              <Route path="/admin"         element={<AdminDashboardPage />} />
              <Route path="*"              element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          </PlayerAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

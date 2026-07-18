'use client';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerAuthProvider } from '@/context/PlayerAuthContext';
import { scrollToId } from '@/lib/motion';
import { onDevtoolsChange } from '@/utils/devtools-protection';

const HomePage           = lazy(() => import('@/pages/HomePage'));
const StorePage          = lazy(() => import('@/pages/StorePage'));
const TopVotersPage      = lazy(() => import('@/pages/TopVotersPage'));
const FaqPage            = lazy(() => import('@/pages/FaqPage'));
const TermsPage          = lazy(() => import('@/pages/TermsPage'));
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'));
const AdminLoginPage     = lazy(() => import('@/pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));

/* ─── Intro loader (first visit only) ─────────────────────────────────────── */
function IntroLoader({ onDone }) {
  const [phase, setPhase] = useState('enter'); // enter → fill → rise → done

  useEffect(() => {
    // Phase 1: show wordmark for a beat, then fill bar
    const t1 = setTimeout(() => setPhase('fill'), 300);
    // Phase 2: bar filled, hold briefly
    const t2 = setTimeout(() => setPhase('rise'), 1700);
    // Phase 3: curtain risen, unmount
    const t3 = setTimeout(() => onDone(), 2250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const rising = phase === 'rise';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: '#F4EFE4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // slide the whole curtain upward on exit
        transform: rising ? 'translateY(-100%)' : 'translateY(0)',
        transition: rising ? 'transform 0.55s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
      }}
    >
      {/* Top lime hairline */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#B4E035' }} />

      {/* Wordmark */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: rising ? 0 : 1,
          transform: rising ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          animation: 'loader-fade-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Logo block */}
        <div style={{
          width: 56, height: 56,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #B4E035 0%, #748F1C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(180,224,53,0.35)',
          fontSize: 28,
        }}>
          ⚡
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: '#1A2E1A',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            margin: 0,
          }}>
            AeroBlast
          </p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#6B7F5A',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            margin: '4px 0 0',
          }}>
            Network Store
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 160,
        height: 3,
        borderRadius: 99,
        background: 'rgba(26,46,26,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 99,
          background: 'linear-gradient(90deg, #B4E035, #748F1C)',
          animation: phase !== 'enter' ? 'progress-fill 1.2s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
          width: phase === 'enter' ? '0%' : undefined,
        }} />
      </div>

      {/* Bottom lime hairline */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(180,224,53,0.3)' }} />
    </div>
  );
}

/* ─── Top progress bar (route changes) ────────────────────────────────────── */
function TopProgressBar({ active }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 3,
        zIndex: 8000,
        pointerEvents: 'none',
        transformOrigin: 'left center',
        background: 'linear-gradient(90deg, #B4E035, #9CC81E)',
        transform: active ? 'scaleX(0)' : 'scaleX(1)',
        animation: active ? 'nav-progress 0.8s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
        opacity: active ? 1 : 0,
        transition: active ? 'none' : 'opacity 0.4s ease 0.2s',
        boxShadow: '0 0 12px rgba(180,224,53,0.6)',
      }}
    />
  );
}

/* ─── Page transition wrapper ──────────────────────────────────────────────── */
function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transState, setTransState] = useState('idle'); // idle | out | in
  const [progressActive, setProgressActive] = useState(false);
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key === prevKey.current) return;
    prevKey.current = location.key;

    // Start top bar + fade out
    setProgressActive(true);
    setTransState('out');

    const t1 = setTimeout(() => {
      setDisplayLocation(location);
      setTransState('in');
    }, 160);

    const t2 = setTimeout(() => {
      setTransState('idle');
      setProgressActive(false);
    }, 360);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [location]);

  const style = {
    out: { animation: 'page-wipe-out 0.16s cubic-bezier(0.4,0,1,1) forwards' },
    in:  { animation: 'page-wipe-in 0.22s cubic-bezier(0.22,1,0.36,1) forwards' },
    idle: {},
  }[transState];

  return (
    <>
      <TopProgressBar active={progressActive} />
      <div style={style}>
        <Routes location={displayLocation}>
          <Route path="/"              element={<HomePage />} />
          <Route path="/store"         element={<StorePage />} />
          <Route path="/top-voters"    element={<TopVotersPage />} />
          <Route path="/faq"           element={<FaqPage />} />
          <Route path="/terms"         element={<TermsPage />} />
          <Route path="/admin/login"   element={<AdminLoginPage />} />
          <Route path="/admin"         element={<AdminDashboardPage />} />
          <Route path="*"              element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

/* ─── Scroll manager ───────────────────────────────────────────────────────── */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const t = setTimeout(() => scrollToId(id), 90);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
  return null;
}

/* ─── Suspense fallback (chunk loading) ────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#F4EFE4]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B4E035]/20 border-t-[#B4E035]" />
      </div>
    </div>
  );
}

/* ─── DevTools overlay ─────────────────────────────────────────────────────── */
function DevtoolsWarningOverlay() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const unsubscribe = onDevtoolsChange(setOpen);
    return unsubscribe;
  }, []);
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2147483647,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(3,7,17,0.97)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', padding: '2rem', textAlign: 'center',
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        border: '2px solid rgba(239,68,68,0.4)',
        boxShadow: '0 0 40px rgba(239,68,68,0.25), inset 0 0 40px rgba(239,68,68,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem', background: 'rgba(239,68,68,0.06)',
      }}>
        <span style={{ fontSize: 38 }}>⛔</span>
      </div>
      <h1 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800,
        color: '#f1f5f9', marginBottom: '0.75rem', letterSpacing: '-0.02em',
      }}>Akses Tidak Diizinkan</h1>
      <p style={{
        fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: '#8ea0b8',
        maxWidth: 380, lineHeight: 1.7, marginBottom: '1.5rem',
      }}>
        Developer Tools terdeteksi terbuka. Tutup DevTools untuk melanjutkan menggunakan situs ini.
      </p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 1rem', borderRadius: 8,
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem', letterSpacing: '0.05em',
      }}>
        <span style={{ opacity: 0.6 }}>Tekan</span>
        <kbd style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem',
        }}>F12</kbd>
        <span style={{ opacity: 0.6 }}>untuk menutup DevTools</span>
      </div>
      <p style={{ marginTop: '2rem', fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: '#435268' }}>
        AeroBlast Security &mdash; Unauthorized access is monitored
      </p>
    </div>
  );
}

/* ─── Root ─────────────────────────────────────────────────────────────────── */
export default function App() {
  // Show intro only once per session
  const [introVisible, setIntroVisible] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return !sessionStorage.getItem('ab_intro_done');
  });

  function handleIntroDone() {
    setIntroVisible(false);
    try { sessionStorage.setItem('ab_intro_done', '1'); } catch { /* */ }
  }

  return (
    <>
      {introVisible && <IntroLoader onDone={handleIntroDone} />}
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <PlayerAuthProvider>
              <DevtoolsWarningOverlay />
              <ScrollManager />
              <Suspense fallback={<PageLoader />}>
                <PageTransition />
              </Suspense>
            </PlayerAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </>
  );
}

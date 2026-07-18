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
  // enter → logo → fill → hold → rise → done
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    // 0ms   : curtain visible, all hidden
    // 400ms : logo fades in
    const t1 = setTimeout(() => setPhase('logo'),  400);
    // 900ms : progress bar starts filling (2.2s duration → done at ~3.1s)
    const t2 = setTimeout(() => setPhase('fill'),  900);
    // 3200ms: brief hold at 100%, tagline visible
    const t3 = setTimeout(() => setPhase('hold'),  3200);
    // 3500ms: curtain sweeps up
    const t4 = setTimeout(() => setPhase('rise'),  3500);
    // 4200ms: unmount
    const t5 = setTimeout(() => onDone(),          4200);
    return () => { [t1,t2,t3,t4,t5].forEach(clearTimeout); };
  }, [onDone]);

  const rising  = phase === 'rise';
  const visible = phase !== 'enter';
  const filling = phase === 'fill' || phase === 'hold' || phase === 'rise';
  const held    = phase === 'hold' || phase === 'rise';

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
        transform: rising ? 'translateY(-100%)' : 'translateY(0)',
        transition: rising ? 'transform 0.72s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
      }}
    >
      {/* Top lime hairline */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#B4E035' }} />

      {/* Centre content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* Logo block */}
        <div style={{
          width: 72, height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #B4E035 0%, #748F1C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 40px rgba(180,224,53,0.4)',
          fontSize: 36,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.88)',
          transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
        }}>
          ⚡
        </div>

        {/* Wordmark */}
        <div style={{
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.55s 0.1s cubic-bezier(0.22,1,0.36,1), transform 0.55s 0.1s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: '#1A2E1A',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            margin: 0,
          }}>
            AeroBlast
          </p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#6B7F5A',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            margin: '6px 0 0',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s 0.25s ease',
          }}>
            Network Store
          </p>
        </div>

        {/* Tagline — appears when bar is almost full */}
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 12,
          color: '#8A9E7A',
          margin: 0,
          letterSpacing: '0.02em',
          opacity: held ? 1 : 0,
          transform: held ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          Memuat pengalaman terbaik…
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 44,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 200,
        height: 3,
        borderRadius: 99,
        background: 'rgba(26,46,26,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 99,
          background: 'linear-gradient(90deg, #B4E035, #9CC81E, #748F1C)',
          backgroundSize: '200% 100%',
          animation: filling
            ? 'progress-fill 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards, shimmer-bar 1.8s linear infinite'
            : 'none',
          width: filling ? undefined : '0%',
          boxShadow: filling ? '0 0 10px rgba(180,224,53,0.5)' : 'none',
          transition: 'box-shadow 0.3s ease',
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

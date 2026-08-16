'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/*
 * Halaman interstitial "Performing security verification" ala Cloudflare
 * (seperti builtbybit.com). Ditampilkan oleh proxy.js sebelum /admin*.
 *
 * Widget Turnstile lulus → POST /api/verify-challenge → cookie clearance
 * di-set → redirect balik ke tujuan semula.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise = null;
function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Redirect hanya boleh path internal — cegah open redirect ke domain lain.
function safeRedirect(raw) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/admin';
  return raw;
}

function randomRayId() {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 16; i++) out += hex[Math.floor(Math.random() * 16)];
  return out;
}

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));

  const boxRef = useRef(null);
  const widgetIdRef = useRef(null);
  // 'checking' | 'success' | 'error'
  const [status, setStatus] = useState('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [rayId] = useState(randomRayId);

  useEffect(() => {
    if (!SITE_KEY) {
      setStatus('error');
      setErrorMsg('Verifikasi tidak dikonfigurasi.');
      return;
    }
    let cancelled = false;

    async function submitToken(token) {
      try {
        const res = await fetch('/api/verify-challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ turnstileToken: token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Verifikasi gagal');
        setStatus('success');
        setTimeout(() => router.replace(redirect), 600);
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message || 'Verifikasi gagal — muat ulang halaman.');
      }
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !boxRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = turnstile.render(boxRef.current, {
          sitekey: SITE_KEY,
          theme: 'dark',
          language: 'id',
          action: 'admin-clearance',
          callback: submitToken,
          'error-callback': () => {
            setStatus('error');
            setErrorMsg('Widget verifikasi gagal dimuat — muat ulang halaman.');
          },
        });
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Gagal memuat layanan verifikasi — periksa koneksi lalu muat ulang.');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* sudah hilang */ }
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const host = typeof window !== 'undefined' ? window.location.hostname : 'store.aeroblast.my.id';

  /*
   * Layout meniru interstitial Cloudflare versi gelap (seperti builtbybit /
   * glorivahost): hostname besar kiri-atas area tengah, widget Turnstile
   * dark dengan checkbox "Verify you are human" yang harus DIKLIK dulu,
   * footer Ray ID di tengah bawah dengan garis pemisah panjang.
   */
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-[#e8e8e8]" style={{ fontFamily: '-apple-system, system-ui, "Segoe UI", Roboto, Arial, sans-serif' }}>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pb-24">
        <h1 className="mb-3 text-4xl font-semibold tracking-tight text-white">{host}</h1>
        <h2 className="mb-3 text-xl font-semibold text-white">Performing security verification</h2>

        <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-[#c5c5c5]">
          This website uses a security service to protect against malicious bots.
          This page is displayed while the website verifies you are not a bot.
        </p>

        {status === 'success' ? (
          <div className="flex items-center gap-3 text-sm font-medium text-[#6ee07a]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M6 10.5l2.5 2.5L14 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verification successful — redirecting…
          </div>
        ) : status === 'error' ? (
          <div className="text-sm text-red-400">
            <p className="mb-3">{errorMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded border border-[#3a3a3a] bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#242424]"
            >
              Muat Ulang
            </button>
          </div>
        ) : (
          <div ref={boxRef} className="min-h-[65px]" />
        )}
      </main>

      <footer className="mx-auto w-full max-w-4xl px-6 pb-10 text-center text-[13px] text-[#a8a8a8]">
        <div className="border-t border-[#3a3a3a] pt-6">
          <p>Ray ID: <span className="font-mono text-[#d5d5d5]">{rayId}</span></p>
          <p className="mt-1.5">Performance and Security by <span className="font-semibold text-white">AeroBlast Shield</span></p>
        </div>
      </footer>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}

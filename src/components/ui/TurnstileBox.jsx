'use client';
import { useEffect, useRef, useState } from 'react';

/*
 * Widget Cloudflare Turnstile generik — dipakai form login admin.
 * onToken(token|null) dipanggil saat challenge lulus / kedaluwarsa.
 * Kalau site key kosong atau script gagal dimuat, komponen tidak merender
 * apa-apa dan onToken tidak pernah dipanggil — server yang memutuskan
 * apakah token wajib (fail-closed di API login).
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

export function TurnstileBox({ action, onToken }) {
  const boxRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [failed, setFailed] = useState(!SITE_KEY);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !boxRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = turnstile.render(boxRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          language: 'id',
          action,
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => setFailed(true),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* sudah hilang */ }
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return null;
  return <div ref={boxRef} className="min-h-[65px]" />;
}

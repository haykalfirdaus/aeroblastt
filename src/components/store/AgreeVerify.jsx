'use client';
import { useEffect, useRef, useState } from 'react';

/*
 * Persetujuan S&K + verifikasi anti-bot Cloudflare Turnstile (sungguhan).
 *
 * Widget Turnstile menggantikan checkbox: menyelesaikan challenge = menyetujui
 * aturan. Token hasil challenge diteruskan ke parent lewat onChange(true, token)
 * dan ikut dikirim ke server saat create order untuk diverifikasi ulang
 * (siteverify) — lihat api beta-payment.
 *
 * Site key dibaca dari NEXT_PUBLIC_TURNSTILE_SITE_KEY. Kalau env belum diset,
 * komponen fail-soft ke checkbox biasa supaya alur order tidak pernah macet.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

/*
 * Token challenge terakhir — dibaca BetaPaymentModal saat create order lalu
 * dikirim ke server untuk siteverify. Module-level supaya keenam tab store
 * tidak perlu meneruskan token lewat props/payload masing-masing.
 */
let lastToken = null;
export function getTurnstileToken() {
  return lastToken;
}
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

export function AgreeVerify({ checked, onChange }) {
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
          action: 'agree-terms',
          callback: (token) => { lastToken = token; onChange(true, token); },
          'expired-callback': () => { lastToken = null; onChange(false, null); },
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

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs leading-snug text-[#4a5e3a]">
        Selesaikan verifikasi di bawah untuk menyetujui{' '}
        <a href="/terms" target="_blank" className="text-[#1d2b1f] underline hover:no-underline">
          Syarat &amp; Ketentuan
        </a>{' '}
        yang berlaku.
      </p>

      {failed ? (
        /* Fallback: Turnstile tidak tersedia (env kosong / script diblokir) —
           kembali ke checkbox supaya pembeli tetap bisa order. */
        <label className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 py-3 text-xs text-[#4a5e3a] shadow-[var(--neu-in)]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked, null)}
            className="h-4 w-4 accent-[#3d7208]"
          />
          Saya menyetujui Syarat &amp; Ketentuan.
        </label>
      ) : (
        <div ref={boxRef} className="min-h-[65px]" />
      )}
    </div>
  );
}

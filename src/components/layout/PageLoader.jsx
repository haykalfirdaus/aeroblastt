'use client';
import { useEffect, useState } from 'react';

/**
 * First-paint loading overlay.
 *
 * Shows once per browser tab: on a cold open or a hard refresh, but NOT when
 * navigating between routes (client-side navigation keeps the module alive, and
 * `sessionStorage` survives soft reloads within the tab).
 *
 * SAFETY: the overlay is an ADDITIVE layer on top of the page, never a gate in
 * front of it. The content underneath is fully rendered and interactive the
 * moment React hydrates. Three independent guards make it impossible for this
 * to leave a user staring at a blank screen:
 *   1. It only ever mounts after hydration, so no-JS users never see it at all.
 *   2. A hard 2s cap dismisses it regardless of what the page is doing.
 *   3. It unmounts itself on `pagehide`, so a bfcache restore is never covered.
 *
 * That ordering matters: a loader that can outlive its own dismissal logic is
 * strictly worse than having no loader.
 */

const KEY = 'aeroblast:seen-loader';
const HOLD_MS = 620; // long enough to read the mark, short enough not to annoy
const HARD_CAP_MS = 2000;

export function PageLoader() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
    } catch {
      // Private mode / storage disabled — treat as "already seen" so the
      // loader never becomes a recurring annoyance we cannot suppress.
      seen = true;
    }

    if (seen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { sessionStorage.setItem(KEY, '1'); } catch { /* noop */ }
      return;
    }

    setVisible(true);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* noop */ }

    const dismiss = () => {
      setLeaving(true);
      // Matches the CSS fade below; the node is removed once it finishes.
      setTimeout(() => setVisible(false), 320);
    };

    const hold = setTimeout(dismiss, HOLD_MS);
    const cap = setTimeout(() => setVisible(false), HARD_CAP_MS);
    const onHide = () => setVisible(false);
    window.addEventListener('pagehide', onHide);

    return () => {
      clearTimeout(hold);
      clearTimeout(cap);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`page-loader${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman"
    >
      <div className="page-loader__mark" aria-hidden="true">
        <span className="page-loader__ring" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      </div>

      <p className="page-loader__word">
        Aero<span>Blast</span>
      </p>
    </div>
  );
}

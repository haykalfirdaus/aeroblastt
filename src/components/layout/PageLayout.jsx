'use client';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useReveal } from '@/hooks/useReveal';

/**
 * App shell.
 *
 * Changes from the previous version, all perf-motivated:
 *
 * 1. ParticlesCanvas removed. Its per-frame cost was O(n²) — at 75 particles
 *    that is 2,775 distance checks EVERY frame just for the connection lines,
 *    plus an unthrottled `mousemove` listener writing to shared state. It ran a
 *    permanent requestAnimationFrame loop that never idled, which pins a core
 *    and destroys INP on mid-range hardware. A soft, calm UI does not want an
 *    ambient particle field anyway. The component file is left on disk in case
 *    you want it elsewhere — it is simply no longer mounted globally.
 *
 * 2. AOS init replaced by `useReveal()` — same declarative `data-aos`
 *    attributes, no library.
 *
 * The `bg-app` shell stays: it is a single fixed, painted-once div.
 */
export function PageLayout({ children }) {
  useReveal();

  return (
    <>
      <div className="bg-app" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navbar />
        <main className="relative flex-1 pt-14">{children}</main>
        <Footer />
      </div>
    </>
  );
}

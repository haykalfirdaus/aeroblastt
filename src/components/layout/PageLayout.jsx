'use client';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * App shell.
 *
 * Deliberately has NO client-side effects. Entrance animations are pure CSS
 * (see .neu-rise / [data-aos] in neu.css), which fixes the class of bug where
 * content stayed invisible: a JS observer combined with `content-visibility`
 * never fired for offscreen subtrees, stranding elements at opacity 0. CSS
 * animations always complete, so content cannot fail to appear.
 *
 * ParticlesCanvas is intentionally not mounted — it ran a permanent rAF loop
 * with O(n²) distance checks (2,775 ops/frame at 75 particles) plus an
 * unthrottled mousemove listener.
 */
export function PageLayout({ children }) {
  return (
    <>
      <div className="bg-app" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navbar />
        <main className="relative flex-1 pt-20">{children}</main>
        <Footer />
      </div>
    </>
  );
}

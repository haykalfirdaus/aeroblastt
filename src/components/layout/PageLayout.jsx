import { useEffect } from 'react';
import { ParticlesCanvas } from './ParticlesCanvas';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { initAOS } from '@/lib/motion';

/**
 * App shell:
 * - Always-on dark grid background (.bg-app) — the wallpaper lives only in Hero.
 * - Ambient particle field behind content.
 * - AOS initialised once for buttery, GPU-only scroll reveals.
 */
export function PageLayout({ children }) {
  useEffect(() => {
    initAOS();
  }, []);

  return (
    <>
      {/* Always-on dark grid shell */}
      <div className="bg-app" aria-hidden="true" />

      {/* Ambient particle field (behind content) */}
      <ParticlesCanvas />

      {/* Main layout */}
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navbar />
        <main className="relative flex-1 pt-14">{children}</main>
        <Footer />
      </div>
    </>
  );
}

'use client';
import { useEffect } from 'react';

/**
 * Scroll-reveal driver — the AOS replacement.
 *
 * Mount ONCE (in PageLayout). It scans for any element carrying `data-aos`,
 * which means the ~40 existing `data-aos="fade-up"` attributes scattered across
 * the section components keep working verbatim — no call site edits required.
 *
 * Why this beats AOS:
 *  - No library payload (AOS is ~14KB JS + 3KB CSS).
 *  - AOS re-runs its handler on every scroll/resize event for the life of the
 *    page. This unobserves each element the moment it reveals, so the observer
 *    drains to empty and costs nothing afterwards.
 *  - Only `opacity` and `transform` are animated — both compositor-only, so a
 *    reveal never triggers layout or paint.
 *
 * A MutationObserver picks up nodes added later (route changes, modals,
 * conditionally rendered lists) without a full rescan.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SELECTOR = '[data-aos]';

    // Reduced motion: show everything immediately, skip the observer entirely.
    if (reduce || !('IntersectionObserver' in window)) {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        el.classList.remove('neu-reveal');
        el.setAttribute('data-shown', 'true');
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          // Honour the existing data-aos-delay values already in the markup.
          const delay = Number(el.getAttribute('data-aos-delay')) || 0;
          if (delay) el.style.transitionDelay = `${delay}ms`;
          el.setAttribute('data-shown', 'true');
          io.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    const register = (el) => {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = '1';
      el.classList.add('neu-reveal');
      io.observe(el);
    };

    document.querySelectorAll(SELECTOR).forEach(register);

    // Catch elements mounted after the initial pass.
    const mo = new MutationObserver((records) => {
      for (const rec of records) {
        for (const node of rec.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(SELECTOR)) register(node);
          node.querySelectorAll?.(SELECTOR).forEach(register);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

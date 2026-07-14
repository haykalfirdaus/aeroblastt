/**
 * Centralised, low-end-friendly motion helpers.
 *
 * - AOS drives declarative scroll reveals (transform + opacity only).
 * - GSAP drives the Hero intro timeline and the smooth section auto-scroll.
 *
 * Everything degrades gracefully: users with `prefers-reduced-motion` get an
 * instant, non-animated experience, and we never animate anything heavier than
 * `transform` / `opacity` so it stays buttery on weak GPUs.
 */
import AOS from 'aos';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let aosStarted = false;

/** Initialise AOS once per session, then refresh on subsequent calls. */
export function initAOS() {
  if (typeof window === 'undefined') return;
  if (prefersReducedMotion()) return;
  // Skip AOS entirely on mobile — saves JS parse + layout work on first load
  if (window.innerWidth < 768) return;

  if (!aosStarted) {
    AOS.init({
      duration: 520,
      easing: 'ease-out-cubic',
      once: true,
      offset: 40,
      disable: 'mobile',
    });
    aosStarted = true;
  } else {
    AOS.refreshHard();
  }
}

/** Height of the fixed navbar, used as scroll offset. */
const NAV_OFFSET = 64;

/**
 * Smoothly scroll to an element id (buttery GSAP tween). Falls back to an
 * instant jump for reduced-motion users. Returns true if the target existed.
 */
export function scrollToId(id, offset = NAV_OFFSET) {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(id);
  if (!el) return false;

  if (prefersReducedMotion()) {
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo(0, y);
    return true;
  }

  gsap.to(window, {
    duration: 0.8,
    ease: 'power2.inOut',
    scrollTo: { y: el, offsetY: offset, autoKill: true },
  });
  return true;
}

/** Smoothly scroll back to the very top of the page. */
export function scrollToTop() {
  if (typeof window === 'undefined') return;
  if (prefersReducedMotion()) {
    window.scrollTo(0, 0);
    return;
  }
  gsap.to(window, { duration: 0.7, ease: 'power2.inOut', scrollTo: { y: 0, autoKill: true } });
}

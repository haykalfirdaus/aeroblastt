/**
 * Centralised motion helpers — zero third-party animation libraries.
 *
 * Previously this module pulled in AOS (~14KB) + GSAP core + ScrollToPlugin
 * (~70KB) purely to fade elements in and smooth-scroll the page. Both are now
 * replaced by platform primitives:
 *
 *  - Scroll reveals  → IntersectionObserver (see `useReveal`), which unobserves
 *    each element after it fires, so the observer drains to empty instead of
 *    running for the whole session.
 *  - Smooth scroll   → native `scrollTo({ behavior: 'smooth' })`, which runs on
 *    the compositor rather than tweening scrollTop from JS each frame.
 *
 * The exported API is UNCHANGED (initAOS / scrollToId / scrollToTop /
 * prefersReducedMotion) so no call site needs editing — `initAOS()` is kept as
 * a deliberate no-op shim.
 */

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * No-op kept for backwards compatibility with existing `useEffect(() => initAOS())`
 * call sites. Reveals are now handled declaratively by `useReveal`.
 */
export function initAOS() {}

/** Height of the fixed navbar, used as scroll offset. */
const NAV_OFFSET = 64;

/**
 * Scroll to an element id. Returns true if the target existed.
 * Honours prefers-reduced-motion by jumping instantly.
 */
export function scrollToId(id, offset = NAV_OFFSET) {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(id);
  if (!el) return false;

  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  return true;
}

/** Scroll back to the very top of the page. */
export function scrollToTop() {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

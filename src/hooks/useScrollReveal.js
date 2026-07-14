import { useEffect, useRef, useState } from 'react';

/**
 * Attach the returned ref to any element; `isVisible` flips to true the
 * first time it scrolls into view, then stays true (mirrors the legacy
 * one-shot `.anim` → `.vis` reveal pattern used across every page).
 */
export function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Respect reduced-motion users by simply showing content immediately.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

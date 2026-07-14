import { useRef, useEffect, useCallback } from 'react';
import { FOTBAR_IMAGES } from '@/data/fotbar';

const SPEED = 0.6; // px per frame

export function FotbarSlider() {
  if (!FOTBAR_IMAGES.length) return null;

  // Triple the images so there's always enough content to loop seamlessly
  const items = [...FOTBAR_IMAGES, ...FOTBAR_IMAGES, ...FOTBAR_IMAGES];

  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  const isPaused = useRef(false);

  // Auto-scroll loop via RAF
  const tick = useCallback(() => {
    const el = containerRef.current;
    if (el && !isPaused.current) {
      el.scrollLeft += SPEED;
      // Seamless loop: reset to 1/3 point when past 2/3
      const third = el.scrollWidth / 3;
      if (el.scrollLeft >= third * 2) el.scrollLeft -= third;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Init scroll at 1/3 so there's room to drag back
    const el = containerRef.current;
    if (el) el.scrollLeft = el.scrollWidth / 3;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // Drag handlers
  const onMouseDown = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    isPaused.current = true;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
    el.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!drag.current.active) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  }, []);

  const stopDrag = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    isPaused.current = false;
    const el = containerRef.current;
    if (el) el.style.cursor = 'grab';
  }, []);

  const onTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    isPaused.current = true;
    drag.current = { active: true, startX: e.touches[0].clientX, startScroll: el.scrollLeft };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!drag.current.active) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = drag.current.startScroll - (e.touches[0].clientX - drag.current.startX);
  }, []);

  const onTouchEnd = useCallback(() => {
    drag.current.active = false;
    isPaused.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', stopDrag);
    return () => window.removeEventListener('mouseup', stopDrag);
  }, [stopDrag]);

  return (
    <section className="border-y border-white/6 py-4 select-none">
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto no-scrollbar px-4"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {items.map((filename, i) => (
          <div
            key={i}
            className="h-36 w-56 shrink-0 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] sm:h-44 sm:w-72"
          >
            <img
              src={`/fotbar/${filename}`}
              alt={`AeroBlast screenshot ${(i % FOTBAR_IMAGES.length) + 1}`}
              draggable={false}
              className="h-full w-full object-cover pointer-events-none"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

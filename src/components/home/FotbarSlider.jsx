import { useRef, useState, useCallback, useEffect } from 'react';
import { FOTBAR_IMAGES } from '@/data/fotbar';

export function FotbarSlider() {
  if (!FOTBAR_IMAGES.length) return null;

  const doubled = [...FOTBAR_IMAGES, ...FOTBAR_IMAGES];
  const trackRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });

  // Saat drag mulai: pause animasi, catat posisi scroll
  const startDrag = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el) return;
    // Ambil posisi scroll sekarang dari CSS animasi → pindah ke scrollLeft
    el.style.animationPlayState = 'paused';
    drag.current = { active: true, startX: clientX, startScroll: el.scrollLeft };
    setPaused(true);
  }, []);

  const moveDrag = useCallback((clientX) => {
    if (!drag.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const delta = drag.current.startX - clientX;
    el.scrollLeft = drag.current.startScroll + delta;
  }, []);

  const endDrag = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const el = trackRef.current;
    if (!el) return;
    // Resume animasi dari posisi scroll saat ini
    el.style.animationPlayState = 'running';
    setPaused(false);
  }, []);

  // Mouse
  const onMouseDown = useCallback((e) => startDrag(e.clientX), [startDrag]);
  const onMouseMove = useCallback((e) => moveDrag(e.clientX), [moveDrag]);
  const onMouseUp = useCallback(() => endDrag(), [endDrag]);

  // Touch
  const onTouchStart = useCallback((e) => startDrag(e.touches[0].clientX), [startDrag]);
  const onTouchMove = useCallback((e) => moveDrag(e.touches[0].clientX), [moveDrag]);
  const onTouchEnd = useCallback(() => endDrag(), [endDrag]);

  // Cleanup jika mouse keluar window
  useEffect(() => {
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseUp]);

  return (
    <section className="overflow-hidden border-y border-white/6 py-4 select-none">
      <div
        ref={trackRef}
        className="marquee-track flex w-max gap-3 cursor-grab active:cursor-grabbing overflow-x-auto no-scrollbar"
        style={{
          animation: 'marquee 32s linear infinite',
          animationPlayState: paused ? 'paused' : 'running',
          willChange: 'transform',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {doubled.map((filename, i) => (
          <div
            key={i}
            className="h-36 w-60 shrink-0 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] sm:h-44 sm:w-72"
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

import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { SectionHeading } from '@/components/ui/SectionHeading';

const SLIDES = [
  {
    title: 'Survive & Thrive',
    subtitle: 'Jelajahi dunia survival seru bersama ratusan player',
    img: 'https://placehold.co/800x500/0e1a30/3b82f6?text=Survive+%26+Thrive',
  },
  {
    title: 'PvP Arena',
    subtitle: 'Buktikan kemampuanmu di arena pertempuran sengit',
    img: 'https://placehold.co/800x500/12213d/60a5fa?text=PvP+Arena',
  },
  {
    title: 'Gacha System',
    subtitle: 'Buka kunci item legendaris dengan sistem gacha eksklusif',
    img: 'https://placehold.co/800x500/060d1a/93c5fd?text=Gacha+System',
  },
  {
    title: 'Rank & Prestise',
    subtitle: 'Dapatkan rank eksklusif dan tunjukkan statusmu',
    img: 'https://placehold.co/800x500/0a1424/8b5cf6?text=Rank+%26+Prestise',
  },
  {
    title: 'Economy System',
    subtitle: 'Bangun kerajaan bisnismu di auction house & market',
    img: 'https://placehold.co/800x500/0e1a30/22d3ee?text=Economy+System',
  },
  {
    title: 'Custom Enchant',
    subtitle: 'Senjatamu, aturanmu — ratusan enchantment unik',
    img: 'https://placehold.co/800x500/12213d/f59e0b?text=Custom+Enchant',
  },
];

export function GallerySlider() {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, active: false });

  /* ── Mouse drag handlers ───────────────────────────────────────────── */
  const onMouseDown = useCallback((e) => {
    const el = trackRef.current;
    if (!el) return;
    dragState.current = { startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, active: true };
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.2;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  }, []);

  const stopDrag = useCallback(() => {
    dragState.current.active = false;
    setIsDragging(false);
  }, []);

  /* ── Touch swipe handlers ──────────────────────────────────────────── */
  const onTouchStart = useCallback((e) => {
    const el = trackRef.current;
    if (!el) return;
    dragState.current = {
      startX: e.touches[0].pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      active: true,
    };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const x = e.touches[0].pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.2;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  }, []);

  const onTouchEnd = useCallback(() => {
    dragState.current.active = false;
  }, []);

  return (
    <section id="gallery" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Galeri Server" title="Dunia AeroBlast" />
      </div>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        role="region"
        aria-label="Galeri gambar server"
        className={cn(
          'flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 pb-3',
          'select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {SLIDES.map((slide) => (
          <GalleryCard key={slide.title} slide={slide} />
        ))}
      </div>
    </section>
  );
}

function GalleryCard({ slide }) {
  return (
    <article
      className="group relative shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-surface"
      style={{
        minWidth: 'clamp(280px, 30vw, 340px)',
        height: 220,
        scrollSnapAlign: 'start',
      }}
    >
      {/* Image with zoom on hover */}
      <img
        src={slide.img}
        alt={slide.title}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
      />

      {/* Bottom gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(1,4,10,0.88) 0%, rgba(1,4,10,0.35) 55%, transparent 100%)',
        }}
      />

      {/* Text content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="mb-0.5 font-display text-sm font-bold leading-tight text-text-bright sm:text-base">
          {slide.title}
        </h3>
        <p className="text-[0.68rem] leading-relaxed text-text-muted sm:text-xs">
          {slide.subtitle}
        </p>
      </div>
    </article>
  );
}

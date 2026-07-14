import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { SectionHeading } from '@/components/ui/SectionHeading';

const SLIDES = [
  {
    title: 'Survive & Thrive',
    subtitle: 'Jelajahi dunia survival bersama ratusan player',
    img: 'https://placehold.co/800x500/0e1a30/3b82f6?text=Survive+%26+Thrive',
  },
  {
    title: 'PvP Arena',
    subtitle: 'Buktikan kemampuanmu di arena pertempuran',
    img: 'https://placehold.co/800x500/12213d/60a5fa?text=PvP+Arena',
  },
  {
    title: 'Gacha System',
    subtitle: 'Buka item legendaris dengan gacha eksklusif',
    img: 'https://placehold.co/800x500/060d1a/93c5fd?text=Gacha+System',
  },
  {
    title: 'Rank & Prestise',
    subtitle: 'Dapatkan rank eksklusif, tunjukkan statusmu',
    img: 'https://placehold.co/800x500/0a1424/8b5cf6?text=Rank+%26+Prestise',
  },
  {
    title: 'Economy System',
    subtitle: 'Bangun bisnis di auction house & market',
    img: 'https://placehold.co/800x500/0e1a30/22d3ee?text=Economy+System',
  },
  {
    title: 'Custom Enchant',
    subtitle: 'Ratusan enchantment unik untuk senjatamu',
    img: 'https://placehold.co/800x500/12213d/f59e0b?text=Custom+Enchant',
  },
];

export function GallerySlider() {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, active: false });

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
    const walk = (e.pageX - el.offsetLeft - dragState.current.startX) * 1.5;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  }, []);

  const stopDrag = useCallback(() => {
    dragState.current.active = false;
    setIsDragging(false);
  }, []);

  const onTouchStart = useCallback((e) => {
    const el = trackRef.current;
    if (!el) return;
    dragState.current = { startX: e.touches[0].pageX - el.offsetLeft, scrollLeft: el.scrollLeft, active: true };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const walk = (e.touches[0].pageX - el.offsetLeft - dragState.current.startX) * 1.5;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  }, []);

  const onTouchEnd = useCallback(() => { dragState.current.active = false; }, []);

  return (
    <section id="gallery" className="py-14 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Galeri Server" title="Dunia AeroBlast" />
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-label="Galeri gambar server"
        className={cn(
          'flex gap-3 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 pb-2 select-none',
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
      className="group relative shrink-0 overflow-hidden rounded-xl border border-white/8 bg-surface"
      style={{ width: 'clamp(220px, 28vw, 300px)', height: 180, scrollSnapAlign: 'start' }}
    >
      <img
        src={slide.img}
        alt={slide.title}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
      />

      {/* gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(1,4,10,0.90) 0%, rgba(1,4,10,0.25) 50%, transparent 100%)' }}
      />

      {/* text — ukuran seragam, tidak ada sm: breakpoint berbeda */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-display text-[0.72rem] font-bold leading-tight text-text-bright">
          {slide.title}
        </p>
        <p className="mt-0.5 text-[0.62rem] leading-snug text-text-muted line-clamp-2">
          {slide.subtitle}
        </p>
      </div>
    </article>
  );
}

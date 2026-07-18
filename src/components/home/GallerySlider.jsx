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
    subtitle: 'Buktikan kemampuanmu di arena pertempuran sengit',
    img: 'https://placehold.co/800x500/12213d/60a5fa?text=PvP+Arena',
  },
  {
    title: 'Gacha System',
    subtitle: 'Buka item legendaris dengan gacha eksklusif',
    img: 'https://placehold.co/800x500/060d1a/93c5fd?text=Gacha+System',
  },
  {
    title: 'Rank & Prestise',
    subtitle: 'Dapatkan rank eksklusif dan tunjukkan statusmu',
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
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  const onMouseDown = useCallback((e) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft };
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!drag.current.active) return;
    trackRef.current.scrollLeft = drag.current.scrollLeft - (e.clientX - drag.current.startX);
  }, []);

  const stopDrag = useCallback(() => {
    drag.current.active = false;
    setIsDragging(false);
  }, []);

  const onTouchStart = useCallback((e) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.touches[0].clientX, scrollLeft: el.scrollLeft };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!drag.current.active) return;
    trackRef.current.scrollLeft = drag.current.scrollLeft - (e.touches[0].clientX - drag.current.startX);
  }, []);

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
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { drag.current.active = false; }}
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
      className="group relative shrink-0 overflow-hidden rounded-xl border border-[#D8D1C0] bg-[#FAFAF7]"
      style={{ width: 260, height: 174 }}
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
        style={{ background: 'linear-gradient(to top, rgba(1,4,10,0.92) 0%, rgba(1,4,10,0.3) 55%, transparent 100%)' }}
      />

      {/* teks — font, ukuran, dan struktur seragam */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <p className="font-sans text-[0.7rem] font-semibold leading-tight text-white">
          {slide.title}
        </p>
        <p className="mt-0.5 font-sans text-[0.6rem] font-normal leading-snug text-white/60 line-clamp-2">
          {slide.subtitle}
        </p>
      </div>
    </article>
  );
}

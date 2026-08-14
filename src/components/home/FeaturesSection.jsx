'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FEATURES } from '@/data/features';
import { cn } from '@/lib/cn';

// Alternate left/right slide per card
const AOS_DIRS = ['fade-right', 'fade-left', 'fade-right', 'fade-left', 'fade-right', 'fade-left', 'fade-right', 'fade-left'];

export function FeaturesSection() {
  // Detail tiap fitur disembunyikan secara default; hanya kartu yang di-klik yang meluas.
  // Tiap kartu berdiri sendiri (boleh lebih dari satu terbuka sekaligus).
  const [openKeys, setOpenKeys] = useState(() => new Set());

  const toggle = (key) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section id="features" className="cv-auto px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Fitur Server"
          title="Semua yang Kamu Butuhkan"
          description="Ketuk tiap fitur untuk melihat detailnya — dari ekonomi hingga PvP, semua dalam satu server yang powerful dan stabil."
          data-aos="fade-up"
          data-aos-duration="800"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((feature, i) => {
            const isOpen = openKeys.has(feature.title);
            const panelId = `feature-panel-${i}`;
            return (
              <GlassCard
                key={feature.title}
                interactive
                className={cn(isOpen && 'shadow-[var(--neu-in)]')}
                data-aos={AOS_DIRS[i % AOS_DIRS.length]}
                data-aos-delay={i * 60}
                data-aos-duration="800"
              >
                {/* Judul fitur — tombol yang membuka/menutup detail */}
                <button
                  type="button"
                  onClick={() => toggle(feature.title)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 p-5 text-left"
                >
                  <span className="neu-icon h-11 w-11 rounded-[14px]">
                    <Icon name={feature.icon} size={19} className="text-[#1d2b1f]" />
                  </span>
                  <h3 className="flex-1 text-sm font-bold text-[#1d2b1f]">{feature.title}</h3>
                  <ChevronDown
                    size={18}
                    className={cn('shrink-0 text-[#4a5e3a] transition-transform duration-300', isOpen && 'rotate-180 text-[#1d2b1f]')}
                  />
                </button>

                {/* Detail fitur — tersembunyi secara default, meluas saat judul di-klik */}
                <div
                  id={panelId}
                  className={cn('grid transition-all duration-300 ease-in-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-3 px-5 pb-5">
                      <p className="text-[0.72rem] leading-relaxed text-[#4a5e3a]">{feature.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {feature.tags.map((tag) => (
                          <span key={tag} className="neu-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

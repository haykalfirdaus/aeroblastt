import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { FEATURES } from '@/data/features';
import { cn } from '@/lib/cn';

export function FeaturesSection() {
  const [ref, visible] = useScrollReveal();

  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Fitur Server"
          title="Semua yang Kamu Butuhkan"
          description="Dari ekonomi hingga PvP, semua tersedia dalam satu server yang powerful dan stabil."
        />

        <div ref={ref} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <GlassCard
              key={feature.title}
              interactive
              className={cn('card-hover transition-all duration-500', visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8')}
              style={{ transitionDelay: visible ? `${i * 50}ms` : '0ms' }}
            >
              <div className="flex flex-col gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon-500/20 bg-neon-500/10 shadow-[0_0_16px_-4px_rgba(59,130,246,0.4)]">
                  <Icon name={feature.icon} size={18} className="text-neon-300" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-black text-text-bright">{feature.title}</h3>
                  <p className="text-[0.72rem] leading-relaxed text-text-muted">{feature.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="badge-pill border border-neon-500/15 bg-neon-500/8 text-neon-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

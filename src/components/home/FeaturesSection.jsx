import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FEATURES } from '@/data/features';

// Alternate left/right slide per card
const AOS_DIRS = ['fade-right', 'fade-left', 'fade-right', 'fade-left', 'fade-right', 'fade-left', 'fade-right', 'fade-left'];

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Fitur Server"
          title="Semua yang Kamu Butuhkan"
          description="Dari ekonomi hingga PvP, semua tersedia dalam satu server yang powerful dan stabil."
          data-aos="fade-up"
          data-aos-duration="800"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <GlassCard
              key={feature.title}
              interactive
              className="card-hover"
              data-aos={AOS_DIRS[i % AOS_DIRS.length]}
              data-aos-delay={i * 60}
              data-aos-duration="800"
            >
              <div className="flex flex-col gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#1d2b1f]/15 bg-[#BFFF5E]/10">
                  <Icon name={feature.icon} size={18} className="text-[#1d2b1f]" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-bold text-[#1d2b1f]">{feature.title}</h3>
                  <p className="text-[0.72rem] leading-relaxed text-[#4a5e3a]">{feature.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="badge-pill border border-[#BFFF5E]/35 bg-[#BFFF5E]/10 text-[#1d2b1f]">
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

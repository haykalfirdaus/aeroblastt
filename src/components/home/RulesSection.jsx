import { Ban, Handshake, TreePine, Settings, Scale } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { RULES } from '@/data/rules';

const CAT_ICONS = [Handshake, TreePine, Settings];

export function RulesSection() {
  return (
    <section id="rules" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Peraturan Server"
          title="Rules & Regulasi"
          description="Baca dan patuhi semua peraturan berikut. Pelanggaran akan dikenakan sanksi tegas."
          data-aos="fade-up"
          data-aos-duration="700"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {RULES.map((cat, catIdx) => {
            const CatIcon = CAT_ICONS[catIdx] ?? Settings;
            const aosDir = catIdx === 0 ? 'fade-right' : catIdx === 1 ? 'fade-up' : 'fade-left';
            return (
              <GlassCard
                key={cat.title}
                data-aos={aosDir}
                data-aos-delay={catIdx * 120}
                data-aos-duration="800"
              >
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CatIcon size={15} className="text-[#1d2b1f] shrink-0" />
                    <h3 className="font-display text-sm font-bold text-[#1d2b1f]">{cat.title}</h3>
                  </div>

                  <ul className="mb-3 flex flex-col gap-2.5">
                    {cat.points.map((pt) => (
                      <li key={pt.label} className="flex items-start gap-2">
                        <Ban size={11} className="mt-0.5 shrink-0 text-danger-bright" />
                        <div>
                          <span className="text-[0.7rem] font-bold text-[#1d2b1f]">{pt.label}: </span>
                          <span className="text-[0.7rem] text-[#4a5e3a]">{pt.text}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-lg border border-danger/18 bg-danger/6 px-3 py-2">
                    <p className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-danger-bright">
                      <Scale size={10} /> Sanksi
                    </p>
                    <p className="text-[0.65rem] text-[#4a5e3a]">{cat.sanction}</p>
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

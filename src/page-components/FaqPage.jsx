'use client';
import { useMemo, useState } from 'react';
import { Search, HelpCircle, MessageCircle, Headphones, Wifi, Gamepad2, Coins, Medal } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { FaqAnswer } from '@/components/faq/FaqAnswer';
import { FAQ_CATEGORIES } from '@/data/faqData';
import { cn } from '@/lib/cn';

const CAT_ICONS = { Wifi, Gamepad2, Coins, Medal };

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return FAQ_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          !q ||
          item.question.toLowerCase().includes(q) ||
          JSON.stringify(item.answer).toLowerCase().includes(q)
      ),
    })).filter((cat) => (activeCategory === 'all' || cat.title === activeCategory) && cat.items.length > 0);
  }, [query, activeCategory]);

  const totalResults = filtered.reduce((s, c) => s + c.items.length, 0);

  return (
    <PageLayout>
      {/* Header */}
      <div className="relative border-b border-[#D8D1C0] bg-[#EDE8DA] px-4 py-10 text-center sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-[#6B7F5A]/10 blur-3xl" />
        </div>
        <span data-aos="fade-down" data-aos-duration="600" className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#6B7F5A]/30 bg-[#6B7F5A]/10 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#566947]">
          <HelpCircle size={11} />
          FAQ
        </span>
        <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="700" className="relative font-display text-2xl font-extrabold text-[#1A2E1A] sm:text-3xl">
          Pertanyaan yang Sering Ditanyakan
        </h1>
        <p data-aos="fade-up" data-aos-delay="200" data-aos-duration="700" className="relative mt-1.5 text-xs text-[#6B7F5A]">
          Tidak menemukan jawaban? Hubungi kami di Discord atau WhatsApp.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div data-aos="fade-up" data-aos-duration="600" className="relative mb-5">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9E7A]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pertanyaan…"
            className="w-full rounded-xl border border-[#D8D1C0] bg-[#FAFAF7] py-2.5 pl-10 pr-4 text-sm font-sans text-[#1A2E1A] placeholder:text-[#8A9E7A] outline-none transition-colors focus:border-[#B4E035]/60 focus:ring-2 focus:ring-[#B4E035]/15"
          />
        </div>

        {/* Category filter pills */}
        <div className="mb-7 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-all font-sans', activeCategory === 'all' ? 'border-[#B4E035]/50 bg-[#B4E035]/15 text-[#748F1C]' : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] hover:border-[#B4E035]/25 hover:text-[#4A5E3E]')}
          >
            Semua
          </button>
          {FAQ_CATEGORIES.map((cat) => {
            const CatIcon = CAT_ICONS[cat.icon];
            return (
              <button
                key={cat.title}
                type="button"
                onClick={() => setActiveCategory(cat.title)}
                className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all font-sans', activeCategory === cat.title ? 'border-[#B4E035]/50 bg-[#B4E035]/15 text-[#748F1C]' : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] hover:border-[#B4E035]/25 hover:text-[#4A5E3E]')}
              >
                {CatIcon && <CatIcon size={11} />}
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {query && (
          <p className="mb-4 text-xs text-[#6B7F5A] font-sans">
            {totalResults} hasil untuk &ldquo;<span className="text-[#1A2E1A]">{query}</span>&rdquo;
          </p>
        )}

        {totalResults === 0 ? (
          <div className="rounded-2xl border border-[#D8D1C0] bg-[#F5F2EA] py-14 text-center">
            <Search size={28} className="mx-auto mb-3 text-[#D8D1C0]" />
            <p className="text-sm font-semibold text-[#1A2E1A] font-display">Tidak ada hasil ditemukan</p>
            <p className="mt-1 text-xs text-[#6B7F5A] font-sans">Coba kata kunci lain atau hubungi Admin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {filtered.map((cat, catIdx) => (
              <section
                key={cat.title}
                data-aos={catIdx % 2 === 0 ? 'fade-right' : 'fade-left'}
                data-aos-duration="800"
              >
                <div className="mb-3 flex items-center gap-2">
                  {CAT_ICONS[cat.icon] && (() => { const CatIcon = CAT_ICONS[cat.icon]; return <CatIcon size={15} className="text-[#748F1C] shrink-0" />; })()}
                  <h2 className="font-display text-base font-bold text-[#1A2E1A]">{cat.title}</h2>
                  <span className="ml-auto rounded-full border border-[#D8D1C0] bg-[#F0EBE0] px-2 py-0.5 font-mono text-[0.65rem] text-[#6B7F5A]">
                    {cat.items.length}
                  </span>
                </div>
                <Accordion>
                  {cat.items.map((item, i) => (
                    <AccordionItem key={i} id={`${cat.title}-${i}`} title={item.question}>
                      <FaqAnswer blocks={item.answer} />
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div data-aos="fade-up" data-aos-duration="800" className="mt-10 rounded-2xl border border-[#D8D1C0] bg-[#F5F2EA] p-5 text-center">
          <Headphones size={20} className="mx-auto mb-2 text-[#8A9E7A]" />
          <p className="font-semibold text-[#1A2E1A] font-display text-sm">Masih punya pertanyaan?</p>
          <p className="mt-1 text-xs text-[#6B7F5A] font-sans">Tim kami siap membantu kamu di Discord dan WhatsApp.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://discord.gg/rgRRnPS9cp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#B4E035]/30 bg-[#B4E035]/10 px-4 py-2 text-xs font-semibold text-[#748F1C] transition hover:bg-[#B4E035]/18"
            >
              <MessageCircle size={13} /> Discord
            </a>
            <a
              href="https://chat.whatsapp.com/F1d5WMvuuiiGGhpPZdAI36"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/8 px-4 py-2 text-xs font-semibold text-success-bright transition hover:bg-success/14"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

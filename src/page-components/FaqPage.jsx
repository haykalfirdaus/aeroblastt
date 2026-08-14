'use client';
import { useMemo, useState } from 'react';
import { Search, MessageCircle, Headphones, Wifi, Gamepad2, Coins, Medal } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { FaqAnswer } from '@/components/faq/FaqAnswer';
import { FAQ_CATEGORIES } from '@/data/faqData';
import { substituteServerVars, useServerConfig } from '@/context/ServerConfigContext';
import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const CAT_ICONS = { Wifi, Gamepad2, Coins, Medal };

/**
 * FAQ — Soft UI.
 *
 * Search + category filter logic is unchanged, including the substituteServerVars
 * pass that keeps searching for "25543" working now that the data stores
 * {{ip}}/{{port}} placeholders.
 *
 * Social links now read from SITE.social instead of hardcoded URLs that had
 * drifted out of sync with the config.
 */
export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const server = useServerConfig();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return FAQ_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          !q ||
          item.question.toLowerCase().includes(q) ||
          substituteServerVars(JSON.stringify(item.answer), server).toLowerCase().includes(q)
      ),
    })).filter(
      (cat) => (activeCategory === 'all' || cat.title === activeCategory) && cat.items.length > 0
    );
  }, [query, activeCategory, server]);

  const totalResults = filtered.reduce((s, c) => s + c.items.length, 0);

  return (
    <PageLayout>
      <PageHeader
        eyebrow="FAQ"
        title="Pertanyaan yang Sering Ditanyakan"
        description="Tidak menemukan jawaban? Hubungi kami di Discord atau WhatsApp."
      />

      <div className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        {/* Search — inset field */}
        <div className="relative mb-5">
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#6b7f5a]"
          />
          <label htmlFor="faq-search" className="sr-only">
            Cari pertanyaan
          </label>
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pertanyaan…"
            className="neu-field pl-11 text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            aria-pressed={activeCategory === 'all'}
            className={cn(
              'inline-flex min-h-[44px] cursor-pointer items-center rounded-full bg-[#fff8f0] px-4 text-xs font-bold',
              '[transition:transform_150ms_ease,box-shadow_150ms_ease] active:scale-[0.96]',
              activeCategory === 'all'
                ? 'text-[#1d2b1f] shadow-[var(--neu-in)]'
                : 'text-[#4a5e3a] shadow-[var(--neu-out)] hover:-translate-y-[2px]'
            )}
          >
            Semua
          </button>
          {FAQ_CATEGORIES.map((cat) => {
            const CatIcon = CAT_ICONS[cat.icon];
            const isActive = activeCategory === cat.title;
            return (
              <button
                key={cat.title}
                type="button"
                onClick={() => setActiveCategory(cat.title)}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full bg-[#fff8f0] px-4 text-xs font-bold',
                  '[transition:transform_150ms_ease,box-shadow_150ms_ease] active:scale-[0.96]',
                  isActive
                    ? 'text-[#1d2b1f] shadow-[var(--neu-in)]'
                    : 'text-[#4a5e3a] shadow-[var(--neu-out)] hover:-translate-y-[2px]'
                )}
              >
                {CatIcon && <CatIcon size={13} aria-hidden="true" />}
                {cat.title}
              </button>
            );
          })}
        </div>

        {query && (
          <p className="mb-4 text-xs text-[#4a5e3a]" role="status" aria-live="polite">
            {totalResults} hasil untuk &ldquo;<span className="font-bold text-[#1d2b1f]">{query}</span>&rdquo;
          </p>
        )}

        {totalResults === 0 ? (
          <div className="rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] py-16 text-center shadow-[var(--neu-out)]">
            <span className="neu-icon mx-auto h-14 w-14">
              <Search size={24} aria-hidden="true" />
            </span>
            <p className="mt-4 font-display text-sm font-bold text-[#1d2b1f]">
              Tidak ada hasil ditemukan
            </p>
            <p className="mt-1 text-xs text-[#4a5e3a]">Coba kata kunci lain atau hubungi Admin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-9">
            {filtered.map((cat) => {
              const CatIcon = CAT_ICONS[cat.icon];
              return (
                <section key={cat.title}>
                  <div className="mb-4 flex items-center gap-3">
                    {CatIcon && (
                      <span className="neu-icon h-11 w-11 rounded-[14px]">
                        <CatIcon size={18} aria-hidden="true" />
                      </span>
                    )}
                    <h2 className="font-display text-base font-extrabold text-[#1d2b1f]">
                      {cat.title}
                    </h2>
                    <span className="neu-tag ml-auto">{cat.items.length}</span>
                  </div>
                  <Accordion>
                    {cat.items.map((item, i) => (
                      <AccordionItem key={i} id={`${cat.title}-${i}`} title={item.question}>
                        <FaqAnswer blocks={item.answer} />
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-8 text-center shadow-[var(--neu-out-lg)]">
          <span className="neu-icon mx-auto h-14 w-14">
            <Headphones size={22} aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-base font-extrabold text-[#1d2b1f]">
            Masih punya pertanyaan?
          </p>
          <p className="mt-1.5 text-xs text-[#4a5e3a]">
            Tim kami siap membantu kamu di Discord dan WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={SITE.social.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#fff8f0] px-6 text-xs font-bold text-[#1d2b1f] shadow-[var(--neu-out)]"
            >
              <MessageCircle size={15} aria-hidden="true" /> Discord
            </a>
            <a
              href={SITE.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#fff8f0] px-6 text-xs font-bold text-[#059669] shadow-[var(--neu-out)]"
            >
              <MessageCircle size={15} aria-hidden="true" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

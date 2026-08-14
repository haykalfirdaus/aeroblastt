'use client';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TERMS } from '@/data/terms';
import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

/**
 * Terms — Soft UI.
 *
 * The emphasis-splitting logic that bolds a phrase inside each term is
 * preserved exactly, including the `warn` tone variant.
 */
export default function TermsPage() {
  return (
    <PageLayout>
      <PageHeader
        eyebrow="Legal"
        title="Syarat & Ketentuan"
        description="Berlaku untuk semua transaksi di AeroBlast Network Store. Harap dibaca sebelum melakukan pembelian."
      />

      <div className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6">
        {/* Notice — debossed so it reads as a system message, not a card */}
        <div className="mb-7 flex items-start gap-3 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-5 py-4 shadow-[var(--neu-in)]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#f59e0b]" aria-hidden="true" />
          <div>
            <p className="text-xs font-extrabold text-[#b45309]">Penting</p>
            <p className="mt-1 text-xs leading-relaxed text-[#4a5e3a]">
              Dengan melakukan pembelian di store ini, kamu dianggap telah membaca dan menyetujui
              seluruh syarat &amp; ketentuan di bawah ini.
            </p>
          </div>
        </div>

        <ol className="flex flex-col gap-4">
          {TERMS.map((term, i) => (
            <li
              key={i}
              className="neu-rise flex items-start gap-4 rounded-[var(--radius-neu-lg)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-5 shadow-[var(--neu-out)]"
              style={{ '--i': i }}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff8f0] font-mono text-xs font-bold text-[#1d2b1f] shadow-[var(--neu-in)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="mb-1.5 font-display text-sm font-extrabold text-[#1d2b1f]">
                  {term.title}
                </h2>
                <p className="text-xs leading-relaxed text-[#4a5e3a]">
                  {term.emphasis
                    ? term.text.split(term.emphasis).flatMap((part, j, arr) =>
                        j < arr.length - 1
                          ? [
                              part,
                              <strong
                                key={j}
                                className={cn(
                                  'font-bold',
                                  term.emphasisTone === 'warn' ? 'text-[#b45309]' : 'text-[#dc2626]'
                                )}
                              >
                                {term.emphasis}
                              </strong>,
                            ]
                          : [part]
                      )
                    : term.text}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-8 text-center shadow-[var(--neu-out-lg)]">
          <p className="font-display text-base font-extrabold text-[#1d2b1f]">
            Ada pertanyaan tentang kebijakan ini?
          </p>
          <p className="mt-1.5 text-xs text-[#4a5e3a]">Hubungi Admin melalui Discord atau WhatsApp.</p>
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
              className="neu-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#fff8f0] px-6 text-xs font-bold text-[#046b4d] shadow-[var(--neu-out)]"
            >
              <MessageCircle size={15} aria-hidden="true" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

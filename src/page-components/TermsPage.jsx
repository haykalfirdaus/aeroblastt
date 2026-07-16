'use client';
import { FileText, AlertTriangle, MessageCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { TERMS } from '@/data/terms';
import { cn } from '@/lib/cn';

export default function TermsPage() {
  return (
    <PageLayout>
      <div className="page-header-bg border-b border-white/8 px-4 py-10 text-center sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-neon-700/8 blur-3xl" />
        </div>
        <span className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon-500/22 bg-neon-500/8 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-neon-300">
          <FileText size={11} /> Legal
        </span>
        <h1 className="relative font-display text-2xl font-extrabold text-text-bright sm:text-3xl">
          Syarat &amp; Ketentuan
        </h1>
        <p className="relative mt-1.5 text-xs text-text-muted">
          Berlaku untuk semua transaksi di AeroBlast Network Store. Harap dibaca sebelum melakukan pembelian.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-xl border border-warning/18 bg-warning/6 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="text-xs font-semibold text-warning">Penting</p>
            <p className="mt-0.5 text-xs text-text-muted">Dengan melakukan pembelian di store ini, kamu dianggap telah membaca dan menyetujui seluruh syarat &amp; ketentuan di bawah ini.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {TERMS.map((term, i) => (
            <GlassCard key={i}>
              <div className="flex items-start gap-3 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neon-500/18 bg-neon-500/8 font-mono text-xs font-bold text-neon-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-text-bright mb-1">{term.title}</h3>
                  <p className="text-xs leading-relaxed text-text-muted">
                    {term.emphasis
                      ? term.text.split(term.emphasis).flatMap((part, j, arr) =>
                          j < arr.length - 1
                            ? [part, <strong key={j} className={cn('font-bold', term.emphasisTone === 'warn' ? 'text-warning' : 'text-danger-bright')}>{term.emphasis}</strong>]
                            : [part]
                        )
                      : term.text}
                  </p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-neon-500/18 bg-neon-500/6 p-5 text-center">
          <p className="text-sm font-semibold text-text-bright">Ada pertanyaan tentang kebijakan ini?</p>
          <p className="mt-1 text-xs text-text-muted">Hubungi Admin melalui Discord atau WhatsApp.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <a href="https://discord.gg/rgRRnPS9cp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-neon-500/25 bg-neon-500/8 px-4 py-2 text-xs font-semibold text-neon-300 transition hover:bg-neon-500/14">
              <MessageCircle size={12} /> Discord
            </a>
            <a href="https://chat.whatsapp.com/F1d5WMvuuiiGGhpPZdAI36" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/8 px-4 py-2 text-xs font-semibold text-success-bright transition hover:bg-success/14">
              <MessageCircle size={12} /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

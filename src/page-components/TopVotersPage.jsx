'use client';
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Trophy, Vote, Gift, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useTopVoters } from '@/hooks/useTopVoters';
import {
  REWARD_TIERS,
  getChipsForRank,
  getPodiumPrize,
  getSeparatorLabel,
  skinUrl,
} from '@/data/voterRewards';
import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function AutoRefreshBar({ lastUpdated }) {
  const [pct, setPct] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setPct(100);
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setPct(Math.max(0, 100 - (elapsed / REFRESH_INTERVAL_MS) * 100));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-[#D8D1C0]">
      <div
        className="h-full rounded-full bg-[#B4E035] transition-[width] duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PodiumCard({ voter, rank }) {
  const sizes  = { 1: 'h-24 w-24', 2: 'h-20 w-20', 3: 'h-20 w-20' };
  const glows  = { 1: 'rgba(245,158,11,0.5)', 2: 'rgba(107,127,90,0.4)', 3: 'rgba(180,120,60,0.4)' };
  const rankLabels = { 1: '#1', 2: '#2', 3: '#3' };
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
  const prizes = getPodiumPrize(rank);

  return (
    <div className={cn('flex flex-col items-center gap-3', orders[rank])}>
      <span className={cn('font-mono text-sm font-bold', rank === 1 ? 'text-warning' : rank === 2 ? 'text-[#4A5E3E]' : 'text-rank-orbiter')}>
        {rankLabels[rank]}
      </span>
      <div className="relative">
        <img
          src={voter ? skinUrl(voter.nickname, 96) : 'https://minotar.net/avatar/Steve/96'}
          alt={voter?.nickname ?? 'Unknown'}
          className={cn('rounded-2xl border-2 object-cover', sizes[rank])}
          style={{ borderColor: glows[rank].replace('0.5', '0.8'), boxShadow: `0 0 30px -5px ${glows[rank]}` }}
          onError={(e) => { e.currentTarget.src = 'https://minotar.net/avatar/Steve/96'; }}
        />
        <span className="absolute -bottom-2 -right-2 rounded-full border border-[#D8D1C0] bg-[#F5F2EA] px-1.5 py-0.5 font-mono text-xs font-bold text-[#1A2E1A]">
          #{rank}
        </span>
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-bold text-[#1A2E1A]">{voter?.nickname ?? '—'}</p>
        <p className="font-mono text-xs text-[#748F1C]">{voter?.votes ?? 0} votes</p>
      </div>
      <div className="flex flex-wrap justify-center gap-1">
        {prizes.map((p, i) => (
          <span key={i} className={cn('rounded-full border px-2 py-0.5 text-[0.6rem] font-bold',
            p.tone === 'gold' ? 'border-warning/30 bg-warning/10 text-warning' :
            p.tone === 'green' ? 'border-success/30 bg-success/10 text-success-bright' :
            p.tone === 'orange' ? 'border-orange-400/30 bg-orange-400/10 text-orange-300' :
            'border-[#B4E035]/30 bg-[#B4E035]/10 text-[#748F1C]'
          )}>{p.text}</span>
        ))}
      </div>
    </div>
  );
}

export default function TopVotersPage() {
  const { voters, status, lastUpdated, isRefreshing, refresh } = useTopVoters({
    limit: 50,
    useProxy: true,
    autoRefresh: true,
    fallbackToDemo: true,
  });

  const rows = [];
  voters.forEach((v, i) => {
    const sep = getSeparatorLabel(i);
    if (sep) rows.push({ type: 'separator', label: sep, key: `sep-${i}` });
    rows.push({ type: 'voter', voter: v, rank: i + 1, key: v.nickname });
  });

  return (
    <PageLayout>
      {/* Header */}
      <div className="relative border-b border-[#D8D1C0] bg-[#EDE8DA] px-4 py-10 text-center sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-warning/8 blur-3xl" />
        </div>
        <span data-aos="fade-down" data-aos-duration="700" className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/8 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-warning">
          <Trophy size={11} /> Top Voters Bulan Ini
        </span>
        <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="800" className="relative font-display text-2xl font-extrabold text-[#1A2E1A] sm:text-3xl">
          Leaderboard Voter
        </h1>
        <p data-aos="fade-up" data-aos-delay="200" data-aos-duration="800" className="relative mt-1.5 text-xs text-[#6B7F5A]">Vote setiap hari dan menangkan reward eksklusif!</p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Reward Tiers */}
        <section className="mb-10">
          <h2 data-aos="fade-right" data-aos-duration="800" className="mb-4 inline-flex items-center gap-2 font-display text-base font-bold text-[#1A2E1A]">
            <Gift size={15} className="text-[#748F1C]" /> Hadiah Akhir Bulan
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {REWARD_TIERS.map((tier, i) => (
              <GlassCard
                key={tier.id}
                className={cn('p-3.5', tier.span === 2 && 'col-span-2')}
                data-aos={i % 2 === 0 ? 'fade-right' : 'fade-left'}
                data-aos-duration="800"
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={cn('rounded-full border px-2 py-0.5 text-[0.62rem] font-bold',
                    tier.tone === 'gold' ? 'border-warning/30 bg-warning/10 text-warning' :
                    tier.tone === 'blue' ? 'border-[#B4E035]/30 bg-[#B4E035]/10 text-[#748F1C]' :
                    tier.tone === 'green' ? 'border-success/30 bg-success/10 text-success-bright' :
                    'border-purple/30 bg-purple/10 text-purple'
                  )}>{tier.pill}</span>
                </div>
                <p className="mb-1.5 text-xs font-semibold text-[#6B7F5A]">{tier.label}</p>
                <div className="flex flex-wrap gap-1">
                  {tier.items.map((item, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-full border border-[#D8D1C0] bg-[#F0EBE0] px-2 py-0.5 text-[0.6rem] text-[#4A5E3E]">
                      <span>{item.name}</span> <span className="font-bold text-[#748F1C]">{item.tag}</span>
                    </span>
                  ))}
                </div>
                {tier.orLabel && (
                  <>
                    <p className="my-1.5 text-[0.55rem] font-semibold uppercase tracking-wider text-[#8A9E7A]">{tier.orLabel}</p>
                    <div className="flex flex-wrap gap-1">
                      {tier.orItems.map((item, i) => (
                        <span key={i} className="flex items-center gap-1 rounded-full border border-[#B4E035]/20 bg-[#B4E035]/8 px-2 py-0.5 text-[0.6rem] text-[#748F1C]">
                          <span>{item.name}</span> <span className="font-bold">{item.tag}</span>
                        </span>
                      ))}
                    </div>
                    {tier.note && <p className="mt-1.5 text-[0.55rem] leading-relaxed text-[#8A9E7A]">{tier.note}</p>}
                  </>
                )}
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Podium */}
        {status === 'success' && voters.length >= 3 && (
          <section className="mb-8">
            <h2 data-aos="fade-up" data-aos-duration="800" className="mb-5 flex items-center justify-center gap-2 font-display text-base font-bold text-[#1A2E1A]">
              <Trophy size={14} className="text-warning" /> Podium
            </h2>
            <div data-aos="fade-up" data-aos-delay="100" data-aos-duration="750" className="flex items-end justify-center gap-6 sm:gap-10">
              <PodiumCard voter={voters[1]} rank={2} />
              <PodiumCard voter={voters[0]} rank={1} />
              <PodiumCard voter={voters[2]} rank={3} />
            </div>
          </section>
        )}

        {/* Full Leaderboard */}
        <section data-aos="fade-up" data-aos-duration="800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-[#1A2E1A]">
              <Users size={14} className="text-[#748F1C]" /> Semua Voter
            </h2>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-[#D8D1C0] bg-[#F0EBE0] px-3 py-1.5 text-xs text-[#6B7F5A] transition hover:border-[#B4E035]/30 hover:text-[#1A2E1A] disabled:opacity-50"
            >
              <RefreshCw size={12} className={cn(isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'Memuat...' : 'Refresh'}
            </button>
          </div>

          {lastUpdated && (
            <div className="mb-3">
              <AutoRefreshBar lastUpdated={lastUpdated} />
              <p className="mt-1 text-right text-[0.6rem] text-[#8A9E7A]">
                Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')} · Auto-refresh tiap 5 menit
              </p>
            </div>
          )}

          <GlassCard>
            {status === 'loading' && (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-[#6B7F5A]">
                <RefreshCw size={14} className="animate-spin" /> Memuat leaderboard...
              </div>
            )}

            {status === 'success' && voters.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Trophy size={28} className="text-[#D8D1C0]" />
                <p className="text-xs text-[#6B7F5A]">Belum ada voter bulan ini. Jadilah yang pertama!</p>
              </div>
            )}

            {status === 'success' && voters.length > 0 && (
              <ul className="divide-y divide-[#D8D1C0]/50">
                {rows.map((row) =>
                  row.type === 'separator' ? (
                    <li key={row.key} className="bg-[#F0EBE0]/60 px-4 py-1.5">
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#8A9E7A]">{row.label}</span>
                    </li>
                  ) : (
                    <li key={row.key} className={cn('flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F0EBE0]/40', row.rank <= 3 && 'bg-[#F0EBE0]/30')}>
                      <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-[#6B7F5A]">#{row.rank}</span>
                      <img
                        src={skinUrl(row.voter.nickname, 40)}
                        alt={row.voter.nickname}
                        loading="lazy"
                        className="h-8 w-8 shrink-0 rounded-lg border border-[#D8D1C0] object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="flex-1 font-mono text-xs font-semibold text-[#1A2E1A]">{row.voter.nickname}</span>
                      <span className="font-mono text-xs font-bold text-[#748F1C]">{row.voter.votes}</span>
                      <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                        {getChipsForRank(row.rank).map((c, i) => (
                          <span key={i} className={cn('rounded-full border px-1.5 py-0.5 text-[0.58rem] font-semibold',
                            c.tone === 'gold' ? 'border-warning/30 bg-warning/10 text-warning' :
                            c.tone === 'orange' ? 'border-orange-400/30 bg-orange-400/10 text-orange-300' :
                            c.tone === 'green' ? 'border-success/30 bg-success/10 text-success-bright' :
                            c.tone === 'purple' ? 'border-purple/30 bg-purple/10 text-purple' :
                            'border-[#B4E035]/30 bg-[#B4E035]/10 text-[#748F1C]'
                          )}>{c.text}</span>
                        ))}
                      </div>
                    </li>
                  )
                )}
              </ul>
            )}
          </GlassCard>
        </section>

        {/* Vote CTA */}
        <div data-aos="fade-up" data-aos-duration="800" className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-[#B4E035]/25 bg-[#B4E035]/[0.07] px-5 py-7 text-center">
          <Vote size={22} className="text-[#748F1C]" />
          <p className="font-display text-base font-bold text-[#1A2E1A]">Sudah Vote Hari Ini?</p>
          <p className="max-w-sm text-xs text-[#6B7F5A]">Vote gratis setiap hari! Dapatkan 15.000 Balance + 5 Basic Key + 1 Vote Key per vote.</p>
          <a href={SITE.voters.voteUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm"><Vote size={13} /> Vote Sekarang</Button>
          </a>
        </div>
      </div>
    </PageLayout>
  );
}

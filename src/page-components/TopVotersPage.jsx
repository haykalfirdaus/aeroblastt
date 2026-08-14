'use client';
import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Trophy, Vote, Gift, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
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

/**
 * Top Voters — Soft UI.
 *
 * All data flow is unchanged: useTopVoters (proxy + auto-refresh + demo
 * fallback), the separator-row builder, and the reward chip helpers.
 *
 * Fixes beyond the reskin:
 *  - AutoRefreshBar animated `width`, a layout property, once per second for
 *    the life of the page. It now animates `transform: scaleX()` on the
 *    compositor, and only while the tab is visible.
 *  - Avatars get explicit width/height so rows do not shift as skins load.
 */

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const TONE_TEXT = {
  gold: 'text-[#b45309]',
  green: 'text-[#059669]',
  orange: 'text-[#ea580c]',
  purple: 'text-[#8b5cf6]',
  blue: 'text-[#2563eb]',
  vote: 'text-[#2563eb]',
  legend: 'text-[#ea580c]',
  aero: 'text-[#059669]',
  rank: 'text-[#b45309]',
  fly: 'text-[#0891b2]',
};

function AutoRefreshBar({ lastUpdated }) {
  const [pct, setPct] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setPct(100);

    const id = setInterval(() => {
      // Skip work entirely while the tab is hidden — a background timer that
      // sets state every second keeps waking the main thread for nothing.
      if (document.hidden) return;
      const elapsed = Date.now() - startRef.current;
      setPct(Math.max(0, 100 - (elapsed / REFRESH_INTERVAL_MS) * 100));
    }, 1000);

    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#fff8f0] shadow-[var(--neu-in)]">
      <div
        className="h-full origin-left rounded-full bg-[#a8f040] [transition:transform_1s_linear]"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  );
}

function PodiumCard({ voter, rank }) {
  const sizes = { 1: 'h-24 w-24', 2: 'h-20 w-20', 3: 'h-20 w-20' };
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
  const rankTone = { 1: 'text-[#b45309]', 2: 'text-[#4a5e3a]', 3: 'text-[#ea580c]' };
  const prizes = getPodiumPrize(rank);
  const px = rank === 1 ? 96 : 80;

  return (
    <div className={cn('flex flex-col items-center gap-3', orders[rank])}>
      <span className={cn('font-mono text-sm font-bold', rankTone[rank])}>#{rank}</span>

      <div className="relative">
        <span
          className={cn(
            'grid place-items-center rounded-full bg-[#fff8f0] p-2 shadow-[var(--neu-out-lg)]',
            rank === 1 && 'p-2.5'
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={voter ? skinUrl(voter.nickname, px) : 'https://minotar.net/avatar/Steve/96'}
            alt={voter?.nickname ?? 'Unknown'}
            width={px}
            height={px}
            className={cn('rounded-full object-cover', sizes[rank])}
            onError={(e) => {
              e.currentTarget.src = 'https://minotar.net/avatar/Steve/96';
            }}
          />
        </span>
        <span className="absolute -bottom-1 -right-1 rounded-full bg-[#fff8f0] px-2.5 py-1 font-mono text-xs font-bold text-[#1d2b1f] shadow-[var(--neu-out)]">
          #{rank}
        </span>
      </div>

      <div className="text-center">
        <p className="font-mono text-sm font-bold text-[#1d2b1f]">{voter?.nickname ?? '—'}</p>
        <p className="font-mono text-xs text-[#4a5e3a]">{voter?.votes ?? 0} votes</p>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {prizes.map((p, i) => (
          <span key={i} className={cn('neu-tag text-[0.6rem]', TONE_TEXT[p.tone])}>
            {p.text}
          </span>
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
      <PageHeader
        eyebrow="Top Voters Bulan Ini"
        title="Leaderboard Voter"
        description="Vote setiap hari dan menangkan reward eksklusif!"
      />

      <div className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">

        {/* Reward tiers */}
        <section className="mb-12">
          <h2 className="mb-5 inline-flex items-center gap-2.5 font-display text-base font-extrabold text-[#1d2b1f]">
            <span className="neu-icon h-11 w-11 rounded-[14px]">
              <Gift size={18} aria-hidden="true" />
            </span>
            Hadiah Akhir Bulan
          </h2>

          <div className="neu-grid neu-grid-3">
            {REWARD_TIERS.map((tier, i) => (
              <article
                key={tier.id}
                className="neu-rise rounded-[var(--radius-neu-lg)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-5 shadow-[var(--neu-out)]"
                style={{ '--i': i }}
              >
                <span className={cn('neu-chip text-[0.62rem]', TONE_TEXT[tier.tone])}>
                  {tier.pill}
                </span>
                <p className="mb-3 mt-3 text-xs font-bold text-[#4a5e3a]">{tier.label}</p>

                <div className="flex flex-wrap gap-1.5">
                  {tier.items.map((item, j) => (
                    <span key={j} className="neu-tag text-[0.6rem]">
                      {item.name} <span className="font-bold text-[#1d2b1f]">{item.tag}</span>
                    </span>
                  ))}
                </div>

                {tier.orLabel && (
                  <>
                    <p className="my-2.5 text-[0.55rem] font-bold uppercase tracking-wider text-[#6b7f5a]">
                      {tier.orLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tier.orItems.map((item, j) => (
                        <span key={j} className="neu-tag text-[0.6rem]">
                          {item.name} <span className="font-bold text-[#1d2b1f]">{item.tag}</span>
                        </span>
                      ))}
                    </div>
                    {tier.note && (
                      <p className="mt-2.5 text-[0.58rem] leading-relaxed text-[#6b7f5a]">
                        {tier.note}
                      </p>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Podium */}
        {status === 'success' && voters.length >= 3 && (
          <section className="mb-12">
            <h2 className="mb-7 flex items-center justify-center gap-2 font-display text-base font-extrabold text-[#1d2b1f]">
              <Trophy size={17} className="text-[#b45309]" aria-hidden="true" /> Podium
            </h2>
            <div className="flex items-end justify-center gap-6 sm:gap-12">
              <PodiumCard voter={voters[1]} rank={2} />
              <PodiumCard voter={voters[0]} rank={1} />
              <PodiumCard voter={voters[2]} rank={3} />
            </div>
          </section>
        )}

        {/* Leaderboard */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2.5 font-display text-base font-extrabold text-[#1d2b1f]">
              <span className="neu-icon h-11 w-11 rounded-[14px]">
                <Users size={18} aria-hidden="true" />
              </span>
              Semua Voter
            </h2>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="neu-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#fff8f0] px-5 text-xs font-bold text-[#4a5e3a] shadow-[var(--neu-out)] disabled:opacity-50"
            >
              <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} aria-hidden="true" />
              {isRefreshing ? 'Memuat...' : 'Refresh'}
            </button>
          </div>

          {lastUpdated && (
            <div className="mb-4">
              <AutoRefreshBar lastUpdated={lastUpdated} />
              <p className="mt-1.5 text-right text-[0.62rem] text-[#6b7f5a]">
                Diperbarui: {lastUpdated.toLocaleTimeString('id-ID')} · Auto-refresh tiap 5 menit
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]">
            {status === 'loading' && (
              <div className="flex items-center justify-center gap-2 py-14 text-xs text-[#4a5e3a]">
                <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> Memuat leaderboard...
              </div>
            )}

            {status === 'success' && voters.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="neu-icon h-14 w-14">
                  <Trophy size={24} aria-hidden="true" />
                </span>
                <p className="text-xs text-[#4a5e3a]">
                  Belum ada voter bulan ini. Jadilah yang pertama!
                </p>
              </div>
            )}

            {status === 'success' && voters.length > 0 && (
              <ul className="p-2">
                {rows.map((row) =>
                  row.type === 'separator' ? (
                    <li key={row.key} className="px-4 pb-1.5 pt-4">
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#6b7f5a]">
                        {row.label}
                      </span>
                    </li>
                  ) : (
                    <li
                      key={row.key}
                      className={cn(
                        'flex items-center gap-3 rounded-[var(--radius-neu)] px-3 py-2.5',
                        row.rank <= 3 && 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                      )}
                    >
                      <span className="w-7 shrink-0 text-center font-mono text-xs font-bold text-[#4a5e3a]">
                        #{row.rank}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={skinUrl(row.voter.nickname, 40)}
                        alt=""
                        width={36}
                        height={36}
                        loading="lazy"
                        decoding="async"
                        className="h-9 w-9 shrink-0 rounded-full object-cover shadow-[var(--neu-out)]"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate font-mono text-xs font-bold text-[#1d2b1f]">
                        {row.voter.nickname}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1d2b1f]">
                        {row.voter.votes}
                      </span>
                      <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
                        {getChipsForRank(row.rank).map((c, i) => (
                          <span key={i} className={cn('neu-tag text-[0.58rem]', TONE_TEXT[c.tone])}>
                            {c.text}
                          </span>
                        ))}
                      </div>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </section>

        {/* Vote CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-6 py-10 text-center shadow-[var(--neu-out-lg)]">
          <span className="neu-icon h-14 w-14">
            <Vote size={22} aria-hidden="true" />
          </span>
          <p className="mt-1 font-display text-lg font-extrabold text-[#1d2b1f]">
            Sudah Vote Hari Ini?
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-[#4a5e3a]">
            Vote gratis setiap hari! Dapatkan 15.000 Balance + 5 Basic Key + 1 Vote Key per vote.
          </p>
          <Button
            as="a"
            href={SITE.voters.voteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2"
          >
            <Vote size={15} aria-hidden="true" /> Vote Sekarang
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}

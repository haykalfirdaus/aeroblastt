'use client';
import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { RankOrderModal } from './RankOrderModal';
import { RANKS, RANK_ORDER } from '@/data/ranks';
import { formatRupiah } from '@/utils/currency';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { usePlayerRank } from '@/hooks/usePlayerRank';
import { cn } from '@/lib/cn';

/**
 * Rank tab — Soft UI.
 *
 * Ordering, pricing, owned/locked logic and the order modal are all unchanged.
 *
 * The visual hierarchy moved from neobrutalism to neumorphism: instead of
 * borders plus opacity dimming (which made cheap tiers look broken rather than
 * secondary), tiers are now separated by ELEVATION. Premium tiers sit higher
 * off the surface (--neu-out-lg), mid tiers sit at the default height, and
 * entry tiers sit flush. Depth is the native way to rank things in Soft UI.
 */

const RANKS_DESC = [...RANKS].reverse();

// idx = position in the DESC array (0 = Universe … 7 = Scout)
const TIER_STYLES = {
  0: { elevation: 'shadow-[var(--neu-out-lg)]', badge: 'ULTIMATE', badgeTone: 'gold', priceClass: 'text-xl', featured: true },
  1: { elevation: 'shadow-[var(--neu-out-lg)]', badge: null, priceClass: 'text-lg', featured: true },
  2: { elevation: 'shadow-[var(--neu-out)]', badge: null, priceClass: 'text-base', featured: true },
  3: { elevation: 'shadow-[var(--neu-out)]', badge: 'POPULAR', badgeTone: 'neon', priceClass: 'text-base', featured: true },
  4: { elevation: 'shadow-[var(--neu-out)]', badge: null, priceClass: 'text-base', featured: false },
  5: { elevation: 'shadow-[var(--neu-out)]', badge: null, priceClass: 'text-sm', featured: false },
  6: { elevation: 'shadow-[var(--neu-out)]', badge: null, priceClass: 'text-sm', featured: false },
  7: { elevation: 'shadow-[var(--neu-out)]', badge: 'STARTER', badgeTone: 'dim', priceClass: 'text-sm', featured: false },
};

export function RankTab() {
  const { nick } = usePlayerAuth();
  const { rank: ownedRank } = usePlayerRank();
  const [selected, setSelected] = useState(null);

  const ownedIdx = RANK_ORDER.indexOf(ownedRank ?? 'NONE');

  return (
    <>

      <div className="neu-grid neu-grid-3">
        {RANKS_DESC.map((rank, idx) => {
          const tier = TIER_STYLES[idx] ?? TIER_STYLES[7];
          const isFeatured = tier.featured;

          const rankIdx = RANK_ORDER.indexOf(rank.key);
          const isOwned = rank.key === ownedRank;
          const isLocked = !!ownedRank && rankIdx <= ownedIdx;

          return (
            <article
              key={rank.key}
              className={cn(
                'group relative flex flex-col rounded-[var(--radius-neu-xl)] p-5',
                'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))]',
                tier.elevation,
                // Locked tiers are debossed rather than faded — they read as
                // "already passed", not as broken/unreadable text.
                isLocked && !isOwned
                  ? 'shadow-[var(--neu-in)]'
                  : 'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease] hover:-translate-y-[3px] hover:shadow-[var(--neu-out-lg)]'
              )}
              data-aos="fade-up"
              data-aos-delay={idx * 50}
            >
              {/* Rank accent bar */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-3.5 h-1 w-11 -translate-x-1/2 rounded-full"
                style={{ background: `var(--color-${rank.accent})`, opacity: isLocked && !isOwned ? 0.35 : 0.9 }}
              />

              {(isOwned || tier.badge) && (
                <div className="mb-2 mt-3 flex justify-center">
                  {isOwned ? (
                    <Badge tone="success">DIMILIKI</Badge>
                  ) : (
                    <Badge tone={tier.badgeTone ?? 'neon'}>{tier.badge}</Badge>
                  )}
                </div>
              )}

              <div className={cn('mb-4 flex flex-col items-center gap-2.5 text-center', !isOwned && !tier.badge && 'mt-5')}>
                <span
                  className="neu-icon h-14 w-14 rounded-full"
                  style={{ color: `var(--color-${rank.accent})` }}
                >
                  <Icon name={rank.icon} size={24} />
                </span>
                <div>
                  <h3 className="font-display text-base font-extrabold text-[#1d2b1f]">{rank.name}</h3>
                  <p className={cn('font-mono font-bold text-[#1d2b1f]', tier.priceClass)}>
                    {formatRupiah(rank.price)}
                  </p>
                </div>
              </div>

              <ul className="mb-5 flex flex-1 flex-col gap-2">
                {rank.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[0.72rem] text-[#4a5e3a]">
                    <Check size={13} className="mt-0.5 shrink-0 text-[#3d7208]" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isOwned ? (
                <Button fullWidth variant="secondary" size="sm" disabled>
                  Rank Kamu
                </Button>
              ) : isLocked ? (
                <Button fullWidth variant="secondary" size="sm" disabled>
                  <Lock size={13} aria-hidden="true" /> Sudah Dilewati
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant={isFeatured ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => nick && setSelected(rank)}
                  disabled={!nick}
                  title={!nick ? 'Login dulu untuk order' : undefined}
                >
                  {nick ? (
                    'Order Sekarang'
                  ) : (
                    <>
                      <Lock size={13} aria-hidden="true" /> Login dulu
                    </>
                  )}
                </Button>
              )}
            </article>
          );
        })}
      </div>

      <RankOrderModal rank={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { RankOrderModal } from './RankOrderModal';
import { RANKS } from '@/data/ranks';
import { formatRupiah } from '@/utils/currency';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// Ranks displayed highest-price first (anchoring effect)
const RANKS_DESC = [...RANKS].reverse();

// idx here = position in the DESC array (0 = Universe, 7 = Scout)
const TIER_STYLES = {
  // Universe — most expensive, ultra premium feel
  0: {
    border: 'border-rank-universe/40',
    glow: 'shadow-[0_0_40px_-6px_var(--color-rank-universe)]',
    ring: 'ring-1 ring-rank-universe/30',
    badge: 'ULTIMATE',
    badgeTone: 'gold',
    bg: 'bg-white/[0.035]',
    priceClass: 'text-xl',
    featured: true,
  },
  // Galatics
  1: {
    border: 'border-rank-galatics/30',
    glow: 'shadow-[0_0_32px_-6px_var(--color-rank-galatics)]',
    ring: 'ring-1 ring-rank-galatics/20',
    badge: null,
    bg: 'bg-white/[0.03]',
    priceClass: 'text-lg',
    featured: true,
  },
  // Quantum
  2: {
    border: 'border-rank-quantum/30',
    glow: 'shadow-[0_0_28px_-6px_var(--color-rank-quantum)]',
    ring: 'ring-1 ring-rank-quantum/20',
    badge: null,
    bg: 'bg-white/[0.025]',
    priceClass: 'text-base',
    featured: true,
  },
  // Vortex
  3: {
    border: 'border-rank-vortex/30',
    glow: 'shadow-[0_0_24px_-6px_var(--color-rank-vortex)]',
    ring: 'ring-1 ring-rank-vortex/20',
    badge: 'POPULAR',
    badgeTone: 'neon',
    bg: 'bg-white/[0.025]',
    priceClass: 'text-base',
    featured: true,
  },
  // Ravest — mid, transition from elite to budget
  4: {
    border: 'border-rank-ravest/20',
    glow: 'shadow-[0_0_20px_-6px_var(--color-rank-ravest)]',
    ring: '',
    badge: null,
    bg: 'bg-white/[0.02]',
    priceClass: 'text-base',
    featured: false,
  },
  // Orbiter
  5: {
    border: 'border-white/10',
    glow: '',
    ring: '',
    badge: null,
    bg: 'bg-white/[0.018]',
    priceClass: 'text-sm',
    featured: false,
  },
  // Voyager
  6: {
    border: 'border-white/8',
    glow: '',
    ring: '',
    badge: null,
    bg: 'bg-white/[0.015]',
    priceClass: 'text-sm',
    featured: false,
  },
  // Scout — cheapest, visually de-emphasized
  7: {
    border: 'border-white/6',
    glow: '',
    ring: '',
    badge: 'STARTER',
    badgeTone: 'dim',
    bg: 'bg-white/[0.01]',
    priceClass: 'text-sm',
    featured: false,
  },
};

export function RankTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);

  return (
    <>
      {/* Anchoring hint */}
      <p className="mb-4 text-center text-xs text-text-faint">
        Tampil dari harga tertinggi — semakin ke bawah semakin terjangkau
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RANKS_DESC.map((rank, idx) => {
          const tier = TIER_STYLES[idx] ?? TIER_STYLES[7];
          const isUltimate = idx === 0;
          const isFeatured = tier.featured;

          return (
            <div
              key={rank.key}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 hw-transition',
                tier.border,
                tier.glow,
                tier.ring,
                tier.bg,
                'hover:scale-[1.015]',
                isFeatured ? 'hover:brightness-110' : 'opacity-90 hover:opacity-100',
              )}
              style={{ '--accent': `var(--color-${rank.accent})` }}
            >
              {/* Top shimmer */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, var(--accent), transparent)`,
                  opacity: isFeatured ? 0.7 : 0.25,
                }}
              />

              {/* Universe gradient overlay */}
              {isUltimate && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6, #22d3ee)' }}
                />
              )}

              <div className="flex h-full flex-col p-4">
                {tier.badge && (
                  <div className="mb-2 flex justify-center">
                    <Badge tone={tier.badgeTone ?? 'neon'}>{tier.badge}</Badge>
                  </div>
                )}

                {/* Icon + name */}
                <div className="mb-3 flex flex-col items-center gap-2 text-center">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl border border-white/8 bg-white/4"
                    style={{ boxShadow: isFeatured ? `0 0 18px -4px var(--accent)` : undefined }}
                  >
                    <Icon
                      name={rank.icon}
                      size={22}
                      className={cn('text-[var(--accent)]', !isFeatured && 'opacity-70')}
                    />
                  </div>
                  <div>
                    <h3 className={cn(
                      'font-display text-sm font-bold',
                      isUltimate ? 'text-gradient' : isFeatured ? 'text-text-bright' : 'text-text-muted',
                    )}>
                      {rank.name}
                    </h3>
                    <p
                      className={cn('font-mono font-bold', tier.priceClass, !isFeatured && 'opacity-70')}
                      style={{ color: `var(--color-${rank.accent})` }}
                    >
                      {formatRupiah(rank.price)}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-4 flex flex-1 flex-col gap-1.5">
                  {rank.features.map((f) => (
                    <li key={f} className={cn(
                      'flex items-start gap-1.5 text-[0.7rem]',
                      isFeatured ? 'text-text-muted' : 'text-text-faint',
                    )}>
                      <Check size={10} className={cn('mt-0.5 shrink-0', isFeatured ? 'text-success-bright' : 'text-text-dim')} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  fullWidth
                  variant={isFeatured ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => nick && setSelected(rank)}
                  disabled={!nick}
                  title={!nick ? 'Login dulu untuk order' : undefined}
                  className={cn(
                    isUltimate && nick && 'bg-gradient-to-r from-purple/80 to-neon-600 text-white',
                    !isFeatured && 'opacity-75',
                  )}
                >
                  {nick ? 'Order Sekarang' : <><Lock size={12} className="inline mr-1" />Login dulu</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <RankOrderModal rank={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

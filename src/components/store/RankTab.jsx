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

// Ranks displayed highest-price first (anchoring effect)
const RANKS_DESC = [...RANKS].reverse();

// idx here = position in the DESC array (0 = Universe, 7 = Scout)
const TIER_STYLES = {
  // Universe — most expensive, ultra premium
  0: {
    border: 'border border-[#1d2b1f]',
    glow: '',
    ring: '',
    badge: 'ULTIMATE',
    badgeTone: 'gold',
    bg: 'bg-[#EEF5D8]',
    priceClass: 'text-xl',
    featured: true,
  },
  // Galatics
  1: {
    border: 'border border-[#1d2b1f]',
    glow: '',
    ring: '',
    badge: null,
    bg: 'bg-[#EEF5D8]',
    priceClass: 'text-lg',
    featured: true,
  },
  // Quantum
  2: {
    border: 'border border-[#1d2b1f]',
    glow: '',
    ring: '',
    badge: null,
    bg: 'bg-[#F1F6DC]',
    priceClass: 'text-base',
    featured: true,
  },
  // Vortex
  3: {
    border: 'border border-[#1d2b1f]',
    glow: '',
    ring: '',
    badge: 'POPULAR',
    badgeTone: 'neon',
    bg: 'bg-[#F1F6DC]',
    priceClass: 'text-base',
    featured: true,
  },
  // Ravest
  4: {
    border: 'border border-[#1d2b1f]',
    glow: '',
    ring: '',
    badge: null,
    bg: 'bg-[#F5F4EE]',
    priceClass: 'text-base',
    featured: false,
  },
  // Orbiter
  5: {
    border: 'border border-[#1d2b1f]',
    glow: '',
    ring: '',
    badge: null,
    bg: 'bg-[#fffdf9]',
    priceClass: 'text-sm',
    featured: false,
  },
  // Voyager
  6: {
    border: 'border border-[#1d2b1f]/60',
    glow: '',
    ring: '',
    badge: null,
    bg: 'bg-[#fffdf9]',
    priceClass: 'text-sm',
    featured: false,
  },
  // Scout — cheapest
  7: {
    border: 'border border-[#1d2b1f]/40',
    glow: '',
    ring: '',
    badge: 'STARTER',
    badgeTone: 'dim',
    bg: 'bg-[#fffdf9]',
    priceClass: 'text-sm',
    featured: false,
  },
};

export function RankTab() {
  const { nick } = usePlayerAuth();
  const { rank: ownedRank } = usePlayerRank();
  const [selected, setSelected] = useState(null);

  const ownedIdx = RANK_ORDER.indexOf(ownedRank ?? 'NONE');

  return (
    <>
      {/* Anchoring hint */}
      <p className="mb-4 text-center text-xs text-[#6b7f5a]">
        Tampil dari harga tertinggi — semakin ke bawah semakin terjangkau
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RANKS_DESC.map((rank, idx) => {
          const tier = TIER_STYLES[idx] ?? TIER_STYLES[7];
          const isUltimate = idx === 0;
          const isFeatured = tier.featured;

          const rankIdx = RANK_ORDER.indexOf(rank.key);
          const isOwned = rank.key === ownedRank;
          const isLocked = !!ownedRank && rankIdx <= ownedIdx;

          return (
            <div
              key={rank.key}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-md border transition-all duration-200 hw-transition',
                tier.border,
                tier.glow,
                tier.ring,
                tier.bg,
                isLocked && !isOwned ? 'opacity-50' : 'hover:scale-[1.015]',
                !isLocked && (isFeatured ? 'hover:brightness-110' : 'opacity-90 hover:opacity-100'),
              )}
              data-aos="fade-up"
              data-aos-delay={idx * 50}
              data-aos-duration="500"
            >
              {/* Top shimmer — unified lime */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, #BFFF5E, transparent)',
                  opacity: isFeatured ? 0.7 : 0.2,
                }}
              />

              {/* Universe green glow overlay */}
              {isUltimate && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{ background: 'linear-gradient(135deg, #BFFF5E, #1d2b1f)' }}
                />
              )}

              <div className="flex h-full flex-col p-4">
                {/* Badge: DIMILIKI overrides tier badge */}
                {isOwned ? (
                  <div className="mb-2 flex justify-center">
                    <Badge tone="success">DIMILIKI</Badge>
                  </div>
                ) : tier.badge ? (
                  <div className="mb-2 flex justify-center">
                    <Badge tone={tier.badgeTone ?? 'neon'}>{tier.badge}</Badge>
                  </div>
                ) : null}

                {/* Icon + name */}
                <div className="mb-3 flex flex-col items-center gap-2 text-center">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-md border border-2 border-[#1d2b1f] bg-[#EEF5D8]"
                    style={{ boxShadow: isFeatured ? '0 0 18px -4px rgba(180,224,53,0.5)' : undefined }}
                  >
                    <Icon
                      name={rank.icon}
                      size={22}
                      className={cn(isFeatured ? 'text-[#1d2b1f]' : 'text-[#6b7f5a]')}
                    />
                  </div>
                  <div>
                    <h3 className={cn(
                      'font-display text-sm font-bold',
                      isUltimate ? 'text-gradient' : isFeatured ? 'text-[#1d2b1f]' : 'text-[#4a5e3a]',
                    )}>
                      {rank.name}
                    </h3>
                    <p
                      className={cn('font-mono font-bold', tier.priceClass, isFeatured ? 'text-[#1d2b1f]' : 'text-[#6b7f5a]')}
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
                      isFeatured ? 'text-[#4a5e3a]' : 'text-[#4a5e3a]',
                    )}>
                      <Check size={10} className={cn('mt-0.5 shrink-0', isFeatured ? 'text-success-bright' : 'text-[#6b7f5a]')} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isOwned ? (
                  <Button
                    fullWidth
                    variant={isFeatured ? 'primary' : 'secondary'}
                    size="sm"
                    disabled
                    className={cn(!isFeatured && 'opacity-75')}
                  >
                    Rank Kamu
                  </Button>
                ) : isLocked ? (
                  <Button
                    fullWidth
                    variant="secondary"
                    size="sm"
                    disabled
                    className="opacity-75"
                  >
                    <Lock size={12} className="inline mr-1" />Sudah Dilewati
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant={isFeatured ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => nick && setSelected(rank)}
                    disabled={!nick}
                    title={!nick ? 'Login dulu untuk order' : undefined}
                    className={cn(
                      isUltimate && nick && 'ring-2 ring-[#BFFF5E]/40',
                      !isFeatured && 'opacity-75',
                    )}
                  >
                    {nick ? 'Order Sekarang' : <><Lock size={12} className="inline mr-1" />Login dulu</>}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RankOrderModal rank={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { RankOrderModal } from './RankOrderModal';
import { RANKS } from '@/data/ranks';
import { formatRupiah } from '@/utils/currency';
import { cn } from '@/lib/cn';

const TIER_STYLES = {
  0: { border: 'border-white/8',              glow: '',                                                      ring: '',                                   badge: null },
  1: { border: 'border-white/8',              glow: '',                                                      ring: '',                                   badge: null },
  2: { border: 'border-white/10',             glow: '',                                                      ring: '',                                   badge: null },
  3: { border: 'border-rank-ravest/20',       glow: 'shadow-[0_0_20px_-6px_var(--color-rank-ravest)]',      ring: '',                                   badge: null },
  4: { border: 'border-rank-vortex/30',       glow: 'shadow-[0_0_24px_-6px_var(--color-rank-vortex)]',      ring: 'ring-1 ring-rank-vortex/20',         badge: 'POPULAR' },
  5: { border: 'border-rank-quantum/30',      glow: 'shadow-[0_0_28px_-6px_var(--color-rank-quantum)]',     ring: 'ring-1 ring-rank-quantum/20',        badge: null },
  6: { border: 'border-rank-galatics/30',     glow: 'shadow-[0_0_32px_-6px_var(--color-rank-galatics)]',   ring: 'ring-1 ring-rank-galatics/20',       badge: null },
  7: { border: 'border-rank-universe/40',     glow: 'shadow-[0_0_40px_-6px_var(--color-rank-universe)]',   ring: 'ring-1 ring-rank-universe/30',       badge: 'ULTIMATE' },
};

export function RankTab() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RANKS.map((rank, idx) => {
          const tier = TIER_STYLES[idx] ?? TIER_STYLES[0];
          const isElite = idx >= 4;
          const isUltimate = idx === 7;

          return (
            <div
              key={rank.key}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border bg-white/[0.02] transition-all duration-200 hw-transition',
                tier.border,
                tier.glow,
                tier.ring,
                'hover:scale-[1.015] hover:bg-white/[0.035]'
              )}
              style={{ '--accent': `var(--color-${rank.accent})` }}
            >
              {/* Top shimmer line */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, var(--accent), transparent)`, opacity: isElite ? 0.7 : 0.35 }}
              />

              {/* Ultimate gradient overlay */}
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
                    <Badge tone={tier.badge === 'ULTIMATE' ? 'gold' : 'neon'}>{tier.badge}</Badge>
                  </div>
                )}

                {/* Icon + name */}
                <div className="mb-3 flex flex-col items-center gap-2 text-center">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl border border-white/8 bg-white/4"
                    style={{ boxShadow: isElite ? `0 0 18px -4px var(--accent)` : undefined }}
                  >
                    <Icon name={rank.icon} size={22} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className={cn('font-display text-sm font-bold text-text-bright', isUltimate && 'text-gradient')}>{rank.name}</h3>
                    <p
                      className="font-mono text-base font-bold"
                      style={{ color: `var(--color-${rank.accent})` }}
                    >
                      {formatRupiah(rank.price)}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-4 flex flex-1 flex-col gap-1.5">
                  {rank.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[0.7rem] text-text-muted">
                      <Check size={10} className="mt-0.5 shrink-0 text-success-bright" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  fullWidth
                  variant={isElite ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelected(rank)}
                  className={isUltimate ? 'bg-gradient-to-r from-purple/80 to-neon-600 text-white' : ''}
                >
                  Order Sekarang
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

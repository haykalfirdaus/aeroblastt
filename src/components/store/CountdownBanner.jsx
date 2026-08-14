import { Flame } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

function Pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Shows a live countdown banner for an active discount.
 *
 * Props:
 *   open     — whether the parent modal is open (pauses ticking when false)
 *   discount — { label: string, expiresAt: number } | null
 *              Pass null (or omit) to hide the banner entirely.
 */
export function CountdownBanner({ open, discount = null }) {
  const tick = useCountdown(open, discount);

  // No discount, or discount already expired — show nothing
  if (!tick || tick.expired) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-[var(--radius-neu-lg)] bg-[#fff8f0] shadow-[var(--neu-in)]">
      <div className="flex flex-col items-center gap-1 px-4 py-2.5 text-center">
        <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#1d2b1f]">
          <Flame size={11} aria-hidden="true" className="text-[#4a5e3a]" />
          Promo {tick.eventLabel} — Berakhir Dalam:
        </p>
        <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-[#1d2b1f]">
          <span>{Pad(tick.days)}</span>
          <span className="text-[#5a7048]">:</span>
          <span>{Pad(tick.hours)}</span>
          <span className="text-[#5a7048]">:</span>
          <span>{Pad(tick.minutes)}</span>
          <span className="text-[#5a7048]">:</span>
          <span>{Pad(tick.seconds)}</span>
        </div>
        <p className="text-[0.6rem] text-[#5a7048]">Hari : Jam : Menit : Detik</p>
      </div>
    </div>
  );
}

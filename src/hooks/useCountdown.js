import { useEffect, useState } from 'react';

const ONE_SECOND = 1000;

/**
 * Computes the current tick for a single discount object.
 *
 * @param {{ label: string, expiresAt: number }} discount
 * @returns tick object
 */
function computeTick(discount) {
  const now = Date.now();
  const diff = discount.expiresAt - now;

  if (diff <= 0) {
    return { expired: true, eventLabel: discount.label };
  }

  return {
    expired: false,
    eventLabel: discount.label,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

/**
 * Ticks every second while `active` is true.
 *
 * @param {boolean} active   — whether the parent component is visible/open
 * @param {{ label: string, expiresAt: number } | null} discount
 *   — the active discount to count down to; pass null to disable entirely.
 *
 * @returns tick object or null
 *   null                                 — no discount / countdown disabled
 *   { expired: true, eventLabel }        — discount has already expired
 *   { expired: false, eventLabel, days, hours, minutes, seconds }
 */
export function useCountdown(active, discount) {
  const [tick, setTick] = useState(() => (discount ? computeTick(discount) : null));

  useEffect(() => {
    // Sync initial state whenever discount changes
    setTick(discount ? computeTick(discount) : null);

    if (!active || !discount) return undefined;

    const id = setInterval(() => setTick(computeTick(discount)), ONE_SECOND);
    return () => clearInterval(id);
  }, [active, discount]);

  if (!discount) return null;
  return tick;
}

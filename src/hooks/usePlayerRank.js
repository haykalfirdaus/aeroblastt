import { useEffect, useState } from 'react';
import { usePlayerAuth } from '@/context/PlayerAuthContext';

const EMPTY = { rank: null, permanent: null, expiry: null };

/**
 * Fetch rank purchasable milik player yang sedang login.
 * Returns { rank, permanent, expiry, loading }
 * - rank: 'SCOUT'|...|null — null = belum punya rank purchasable sama sekali.
 * - permanent: true kalau rank tanpa masa berlaku (LuckPerms expiry = 0),
 *   false kalau rank bulanan (temporary), null kalau tidak punya rank.
 * - expiry: unix timestamp (detik) kadaluarsa, null kalau permanen / tanpa rank.
 */
export function usePlayerRank() {
  const { nick } = usePlayerAuth();
  const [info, setInfo] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nick) { setInfo(EMPTY); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/player/rank?nick=${encodeURIComponent(nick)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setInfo(data.ok && data.rank
          ? { rank: data.rank, permanent: data.permanent ?? null, expiry: data.expiry ?? null }
          : EMPTY);
      })
      .catch(() => { if (!cancelled) setInfo(EMPTY); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [nick]);

  return { ...info, loading };
}

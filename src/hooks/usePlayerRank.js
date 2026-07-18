import { useEffect, useState } from 'react';
import { usePlayerAuth } from '@/context/PlayerAuthContext';

/**
 * Fetch rank purchasable milik player yang sedang login.
 * Returns { rank: 'SCOUT'|...|null, loading: boolean }
 * rank null = belum punya rank purchasable sama sekali.
 */
export function usePlayerRank() {
  const { nick } = usePlayerAuth();
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nick) { setRank(null); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/player/rank?nick=${encodeURIComponent(nick)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setRank(data.ok && data.rank ? data.rank : null); })
      .catch(() => { if (!cancelled) setRank(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [nick]);

  return { rank, loading };
}

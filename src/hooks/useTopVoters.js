import { useCallback, useEffect, useRef, useState } from 'react';
import { SITE } from '@/data/config';
import { DEMO_VOTERS } from '@/data/voterRewards';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Fetches top voters via the server-side proxy at /api/voters
 * so the minecraft-mp API key is never exposed in the browser bundle.
 *
 * @param {object} opts
 * @param {number}  opts.limit          - how many voters to request
 * @param {boolean} opts.autoRefresh    - re-poll every 5 minutes
 * @param {boolean} opts.fallbackToDemo - show demo data on failure
 */
export function useTopVoters({ limit = 5, autoRefresh = false, fallbackToDemo = false } = {}) {
  const [voters, setVoters] = useState([]);
  const [status, setStatus] = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef(null);

  const fetchVoters = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);

      try {
        const res = await fetch(`${SITE.voters.apiUrl}?limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();

        let list = Array.isArray(payload) ? payload : payload.voters || payload.data || [];
        list = list
          .map((v) => ({
            nickname: v.nickname || v.name || v.player || 'Unknown',
            votes: Number(v.votes || v.vote_count || v.count || 0),
          }))
          .sort((a, b) => b.votes - a.votes);

        setVoters(list);
        setStatus(list.length ? 'success' : 'empty');
        setLastUpdated(new Date());
      } catch {
        if (fallbackToDemo) {
          setVoters(DEMO_VOTERS);
          setStatus('success');
        } else {
          setVoters([]);
          setStatus('empty');
        }
        setLastUpdated(new Date());
      } finally {
        setIsRefreshing(false);
      }
    },
    [limit, fallbackToDemo]
  );

  useEffect(() => {
    fetchVoters(false);
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchVoters(false), REFRESH_INTERVAL_MS);
      return () => clearInterval(timerRef.current);
    }
  }, [fetchVoters, autoRefresh]);

  return {
    voters,
    status,
    lastUpdated,
    isRefreshing,
    refresh: () => fetchVoters(true),
    refreshIntervalMs: REFRESH_INTERVAL_MS,
  };
}

/**
 * Fetches active discounts from the backend and filters to non-expired ones.
 * Results are cached for 5 minutes at the module level so repeated mounts
 * across the same page session don't re-fetch.
 *
 * Returns { discounts, loading, error }
 *   discounts — [{ id, code, percent, categories, expiresAt }]  (expiresAt is a number/ms)
 *   loading   — true while the first fetch is in-flight
 *   error     — always null (errors are swallowed; discounts falls back to [])
 */

import { useEffect, useState } from 'react';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Module-level cache shared across all hook instances.
const cache = {
  data: null,      // array of raw discount objects from the API
  fetchedAt: 0,    // timestamp of last successful fetch
};

function isExpired(discount) {
  return discount.expiresAt != null && discount.expiresAt <= Date.now();
}

export function useActiveDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null); // always null — errors are swallowed

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Serve from cache if still fresh
      if (cache.data !== null && Date.now() - cache.fetchedAt < CACHE_TTL) {
        const active = cache.data.filter((d) => !isExpired(d));
        if (!cancelled) {
          setDiscounts(active);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/admin/discounts');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();

        // Normalise: ensure expiresAt is a number (ms since epoch)
        const normalised = (Array.isArray(raw) ? raw : []).map((d) => ({
          ...d,
          expiresAt: d.expiresAt != null ? Number(d.expiresAt) : null,
        }));

        cache.data = normalised;
        cache.fetchedAt = Date.now();

        const active = normalised.filter((d) => !isExpired(d));
        if (!cancelled) {
          setDiscounts(active);
          setLoading(false);
        }
      } catch {
        // Silently fall back to empty array — no error surfaced to UI
        if (!cancelled) {
          setDiscounts([]);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { discounts, loading, error };
}

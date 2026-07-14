/**
 * Fetches active announcements from the backend and filters to non-expired ones.
 * Results are cached for 5 minutes at the module level.
 *
 * Returns { announcements, loading }
 *   announcements — array of non-expired announcement objects from the API
 *   loading       — true while the first fetch is in-flight
 */

import { useEffect, useState } from 'react';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Module-level cache shared across all hook instances.
const cache = {
  data: null,    // raw array from the API
  fetchedAt: 0,  // timestamp of last successful fetch
};

function isExpired(announcement) {
  return announcement.expiresAt != null && Number(announcement.expiresAt) <= Date.now();
}

export function useActiveAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Serve from cache if still fresh
      if (cache.data !== null && Date.now() - cache.fetchedAt < CACHE_TTL) {
        const active = cache.data.filter((a) => !isExpired(a));
        if (!cancelled) {
          setAnnouncements(active);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/admin/announcements');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();

        const normalised = (Array.isArray(raw) ? raw : []).map((a) => ({
          ...a,
          expiresAt: a.expiresAt != null ? Number(a.expiresAt) : null,
        }));

        cache.data = normalised;
        cache.fetchedAt = Date.now();

        const active = normalised.filter((a) => !isExpired(a));
        if (!cancelled) {
          setAnnouncements(active);
          setLoading(false);
        }
      } catch {
        // Silently fall back to empty array
        if (!cancelled) {
          setAnnouncements([]);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { announcements, loading };
}

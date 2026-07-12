import { useEffect, useState } from 'react';
import { SITE } from '@/data/config';

/**
 * Live server status (online/offline/player count) from mcsrvstat.us.
 * Mirrors the legacy inline fetch in script.js, including its three
 * possible states: loading ("..."), online/offline, and network error.
 */
export function useServerStatus() {
  const [status, setStatus] = useState({ state: 'loading', online: false, players: null });

  useEffect(() => {
    let cancelled = false;

    fetch(SITE.server.statusApi)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.online) {
          setStatus({ state: 'online', online: true, players: { online: data.players?.online ?? 0, max: data.players?.max ?? 0 } });
        } else {
          setStatus({ state: 'offline', online: false, players: null });
        }
      })
      .catch(() => {
        if (!cancelled) setStatus({ state: 'error', online: false, players: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

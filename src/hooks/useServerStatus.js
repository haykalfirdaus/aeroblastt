import { useEffect, useState } from 'react';
import { buildStatusApi, useServerConfig } from '@/context/ServerConfigContext';

/**
 * Live server status (online/offline/player count) from mcsrvstat.us.
 * Mirrors the legacy inline fetch in script.js, including its three
 * possible states: loading ("..."), online/offline, and network error.
 *
 * Alamat servernya datang dari ServerConfigContext, jadi mengganti IP/port
 * dari panel admin langsung ikut mengubah target polling ini.
 */
export function useServerStatus() {
  const { ip, port } = useServerConfig();
  const [status, setStatus] = useState({ state: 'loading', online: false, players: null });

  useEffect(() => {
    let cancelled = false;

    fetch(buildStatusApi(ip, port))
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
  }, [ip, port]);

  return status;
}

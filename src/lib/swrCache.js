/*
 * Cache fetch GET ringan: stale-while-revalidate.
 *
 * - readCache(key)  → data terakhir dari sessionStorage (instan, tanpa await),
 *   dipakai sebagai initial state supaya UI tidak menampilkan skeleton/spinner
 *   pada kunjungan kedua — data lama tampil dulu, lalu diganti hasil fetch.
 * - cachedFetchJson(key, url, opts) → fetch biasa yang menyimpan hasil sukses
 *   ke cache. TTL hanya membatasi readCache; fetch tetap selalu jalan.
 *
 * sessionStorage (bukan localStorage): cache mati bersama tab, jadi data
 * admin tidak menginap di disk pemakai bersama.
 */

const PREFIX = 'ab:cache:';
const DEFAULT_TTL = 5 * 60 * 1000;

export function readCache(key, ttl = DEFAULT_TTL) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw);
    if (Date.now() - t > ttl) return null;
    return d;
  } catch {
    return null;
  }
}

export function writeCache(key, data) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), d: data }));
  } catch {
    /* storage penuh / private mode — cache saja yang gagal, fetch tetap jalan */
  }
}

export async function cachedFetchJson(key, url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Request gagal (${res.status})`);
  const data = await res.json();
  writeCache(key, data);
  return data;
}

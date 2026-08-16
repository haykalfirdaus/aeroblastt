/*
 * Clearance token — bukti bahwa browser sudah lulus verifikasi Cloudflare
 * Turnstile di halaman interstitial (/verify), ala cf_clearance milik
 * Cloudflare yang dipakai builtbybit.com.
 *
 * Dipakai di dua runtime sekaligus:
 *   - proxy.js (Edge)          → verifyClearance() sebelum melepas /admin*
 *   - API routes (Node)        → signClearance() saat challenge lulus,
 *                                verifyClearance() lagi di POST login
 * Karena itu semua kriptonya pakai Web Crypto (crypto.subtle) + btoa/atob,
 * bukan node:crypto.
 *
 * Format token: base64url(JSON{ip, iat}) + '.' + base64url(HMAC-SHA256).
 * Terikat IP dan kedaluwarsa 30 menit — dicuri pun tidak berguna dari IP lain.
 */

export const CLEARANCE_COOKIE = 'aeroblast_clearance';
export const CLEARANCE_TTL_MS = 30 * 60 * 1000;

const encoder = new TextEncoder();

function toBase64Url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signClearance(ip) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('Missing ADMIN_SECRET env var');
  const payload = toBase64Url(JSON.stringify({ ip, iat: Date.now() }));
  const sig = await hmacHex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyClearance(token, ip) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !token || typeof token !== 'string') return false;

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  let expected;
  try { expected = await hmacHex(secret, payload); } catch { return false; }
  if (!timingSafeEqualStr(sig, expected)) return false;

  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    if (!parsed.iat || Date.now() - parsed.iat > CLEARANCE_TTL_MS) return false;
    if (parsed.ip !== ip) return false;
    return true;
  } catch {
    return false;
  }
}

/*
 * Gate aktif hanya kalau ketiga env lengkap. Tanpa salah satunya, /admin
 * dilepas tanpa challenge (fail-soft) — konsisten dengan fallback checkbox
 * AgreeVerify di store, dan mencegah admin terkunci gara-gara env belum diset.
 */
export function clearanceGateEnabled() {
  return Boolean(
    process.env.ADMIN_SECRET
    && process.env.TURNSTILE_SECRET_KEY
    && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

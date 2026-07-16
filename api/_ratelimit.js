// In-memory rate limiter — per Vercel Lambda instance.
// Cukup untuk mencegah brute-force login karena setiap IP yang gagal
// berkali-kali akan di-block di instance manapun yang mereka landing.

const store = new Map(); // ip → { count, resetAt }

export function rateLimit(ip, { max = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { ok: true, remaining: max - entry.count };
}

// Bersihkan entries lama tiap 30 menit biar tidak leak memory
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now > val.resetAt) store.delete(key);
  }
}, 30 * 60 * 1000);

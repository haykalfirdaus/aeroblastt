/**
 * Discount utilities — fetch from live API and validate codes.
 * All data comes from /api/admin/discounts (public GET endpoint).
 */

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function fetchActiveDiscounts() {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
  try {
    const res = await fetch('/api/admin/discounts');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    _cache = Array.isArray(data) ? data : [];
    _cacheTime = now;
    return _cache;
  } catch {
    return _cache ?? [];
  }
}

export async function checkDiscountCode(inputCode, category) {
  if (!inputCode || !inputCode.trim()) {
    return { valid: false, message: 'Masukkan kode diskon!' };
  }

  const code = inputCode.toUpperCase().trim();
  const discounts = await fetchActiveDiscounts();
  const discount = discounts.find((d) => d.code === code);

  if (!discount) {
    return { valid: false, message: 'Kode tidak valid atau tidak ditemukan.' };
  }

  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return { valid: false, message: 'Maaf, kode diskon ini sudah kedaluwarsa!' };
  }

  // If category provided, check if this discount applies
  if (category && discount.categories && discount.categories.length > 0) {
    const match = discount.categories.some(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
    if (!match) {
      return { valid: false, message: `Kode ini tidak berlaku untuk kategori ${category}.` };
    }
  }

  return {
    valid: true,
    percent: discount.percent,
    message: `Diskon ${discount.percent}% berhasil diterapkan!`,
  };
}

/** Returns true if there are any active (non-expired) discounts — used to show/hide input. */
export async function hasActiveDiscounts() {
  const discounts = await fetchActiveDiscounts();
  return discounts.length > 0;
}

// Server-side price validation — sumber kebenaran ada di sini, bukan di client.
// Hacker bisa manipulasi baseAmount dari browser, tapi server reject kalau di bawah minimum.

// Rank: harga base (sebelum upgrade deduction)
export const RANK_PRICES = { SCOUT: 5000, VOYAGER: 20000, ORBITER: 40000, RAVEST: 70000, VORTEX: 120000, QUANTUM: 200000, GALATICS: 300000, UNIVERSE: 400000 };
export const RANK_ORDER = ['NONE', 'SCOUT', 'VOYAGER', 'ORBITER', 'RAVEST', 'VORTEX', 'QUANTUM', 'GALATICS', 'UNIVERSE'];

// Key: harga per unit
export const KEY_PRICES = { BASIC: 1000, VOTE: 2000, VIP: 5000, LEGEND: 10000, AEROSPACE: 20000 };

// Skill: harga per level per kategori
export const SKILL_CATEGORY_PRICES = { combat: 3000, semi: 2500, gather: 2000 };

// Balance: Rp 1 = 20 in-game balance, minimum order Rp 5000
export const BALANCE_RATE = 20;
export const BALANCE_MIN_RUPIAH = 5000;

// Command: basePrice 30 hari; permanent = 2x
export const COMMAND_PRICES = { FLY: 30000, GOD: 30000, FEED: 10000, HEAL: 10000, TP: 20000, REPAIR: 10000, INVSEE: 25000, UTILITY_BUNDLE: 15000 };

// Cosmetic: prefix base + addon nick color
export const COSMETIC_BASE = 25000;
export const COSMETIC_NICK_ADDON = 10000;

// Diskon maksimum yang boleh diklaim (server tidak akan terima diskon > ini)
export const MAX_DISCOUNT_PCT = 90;

/**
 * Hitung minimum valid baseAmount untuk tiap tipe order.
 * Return null kalau data tidak valid.
 */
export function getMinBaseAmount(type, details) {
  const disc = Math.min(Math.max(Number(details?.discountPct ?? 0), 0), MAX_DISCOUNT_PCT);
  const applyDisc = (price) => Math.round(price * (1 - disc / 100));

  if (type === 'rank') {
    const target = String(details?.target || '').toUpperCase();
    const owned  = String(details?.owned  || 'NONE').toUpperCase();
    const targetPrice = RANK_PRICES[target];
    const ownedPrice  = RANK_PRICES[owned] ?? 0;
    if (!targetPrice) return null;
    const rankIdx    = RANK_ORDER.indexOf(target);
    const ownedIdx   = RANK_ORDER.indexOf(owned === 'NONE' ? 'NONE' : owned);
    if (ownedIdx >= rankIdx) return null; // owned >= target — tidak valid
    const base = targetPrice - ownedPrice;
    const duration = String(details?.duration || 'permanent').toLowerCase();
    // durasi sementara boleh lebih murah (misal 30 hari = 50% dari permanent)
    const durationMult = duration === 'permanent' ? 1 : 0.5;
    return Math.max(1, Math.round(applyDisc(base) * durationMult));
  }

  if (type === 'key') {
    const keyName = String(details?.keyName || '').toUpperCase();
    const qty     = Math.max(1, Math.floor(Number(details?.qty ?? 1)));
    const unitPrice = KEY_PRICES[keyName];
    if (!unitPrice) return null;
    return applyDisc(unitPrice * qty);
  }

  if (type === 'skill') {
    const cat    = String(details?.skillCategory || details?.category || 'gather').toLowerCase();
    const levels = Math.max(1, Math.floor(Number(details?.levels ?? 1)));
    const pricePerLevel = SKILL_CATEGORY_PRICES[cat] ?? SKILL_CATEGORY_PRICES.gather;
    return applyDisc(pricePerLevel * levels);
  }

  if (type === 'balance') {
    const balance = Number(details?.balance ?? 0);
    if (balance <= 0) return null;
    const rupiah = Math.ceil(balance / BALANCE_RATE);
    if (rupiah < BALANCE_MIN_RUPIAH) return null;
    return applyDisc(rupiah);
  }

  if (type === 'command') {
    const cmdKey  = String(details?.cmdName || '').toUpperCase();
    const duration = String(details?.duration || '30').toLowerCase();
    const basePrice = COMMAND_PRICES[cmdKey];
    if (!basePrice) return null;
    const mult = duration.includes('perm') ? 2 : 1;
    return applyDisc(basePrice * mult);
  }

  if (type === 'cosmetic') {
    const hasNickColor = !!(details?.nickColor);
    const base = COSMETIC_BASE + (hasNickColor ? COSMETIC_NICK_ADDON : 0);
    return applyDisc(base);
  }

  return null;
}

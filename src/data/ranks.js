/**
 * The 8 purchasable rank tiers, in ascending order. `key` matches the
 * legacy RANK_PRICES / RANK_ORDER keys used for upgrade-price math, so
 * "upgrade from X to Y" calculations stay identical to the original.
 */
export const RANKS = [
  {
    key: 'SCOUT',
    name: 'Scout',
    icon: 'TreePine',
    accent: 'rank-scout',
    price: 5000,
    features: ['Home Limit: 5', 'PlayerVault: 1', 'P-Warp Limit: 2', '/stonecutter & /wb', 'Scout Kits'],
  },
  {
    key: 'VOYAGER',
    name: 'Voyager',
    icon: 'Sailboat',
    accent: 'rank-voyager',
    price: 20000,
    features: ['Home Limit: 10', 'PlayerVault: 3', 'P-Warp Limit: 3', '/ec & /wb & /stonecutter', 'Voyager Kits'],
  },
  {
    key: 'ORBITER',
    name: 'Orbiter',
    icon: 'Satellite',
    accent: 'rank-orbiter',
    price: 40000,
    features: ['Home Limit: 15 | PV: 6', 'P-Warp Limit: 5', '/ec, /trash, /stonecutter', '/grindstone & /wb', 'Orbiter Kits'],
  },
  {
    key: 'RAVEST',
    name: 'Ravest',
    icon: 'Star',
    accent: 'rank-ravest',
    price: 70000,
    features: ['Home Limit: 25 | PV: 10', 'P-Warp Limit: 10', '/feed & /anvil', '/repair & /recipe', 'Ravest Kits'],
  },
  {
    key: 'VORTEX',
    name: 'Vortex',
    icon: 'Gem',
    accent: 'rank-vortex',
    price: 120000,
    badge: 'POPULAR',
    features: ['Home Limit: 50 | PV: 20', 'P-Warp Limit: 20', '/pweather & /ptime', '/nick & /hat', 'Vortex Kits'],
  },
  {
    key: 'QUANTUM',
    name: 'Quantum',
    icon: 'ShieldHalf',
    accent: 'rank-quantum',
    price: 200000,
    features: ['Home Limit: 100 | PV: 40', 'P-Warp Limit: 50', '/fly & /heal', '/msgtoggle & /repairall', 'Quantum Kits'],
  },
  {
    key: 'GALATICS',
    name: 'Galatics',
    icon: 'Crown',
    accent: 'rank-galatics',
    price: 300000,
    features: ['Home Limit: 500 | PV: 75', 'P-Warp Limit: 100', '/tptoggle & /invsee', '/weather & /time', 'Galatics Kits'],
  },
  {
    key: 'UNIVERSE',
    name: 'Universe',
    icon: 'Globe',
    accent: 'rank-universe',
    price: 400000,
    badge: 'ULTIMATE',
    features: ['Home: Unlimited | PV: 100', 'P-Warp: Unlimited', '/god & /vanish', 'All Previous Features', 'Universe Ultimate Kits'],
  },
];

/** key -> base price, plus a NONE=0 entry, matching legacy RANK_PRICES. */
export const RANK_PRICES = { NONE: 0, ...Object.fromEntries(RANKS.map((r) => [r.key, r.price])) };

/** Ascending tier order incl. NONE, used to grey out same/lower tiers in the "owned rank" dropdown. */
export const RANK_ORDER = ['NONE', ...RANKS.map((r) => r.key)];

/** Duration options for rank purchases: a 1-month "decoy" vs. permanent best value. */
export const RANK_DURATION_OPTIONS = [
  { id: 'monthly', label: '1 Bulan', sub: 'Rugi Jangka Panjang', percentOfBase: 80, isDefault: false },
  { id: 'permanent', label: 'Permanen', sub: 'Aktif Selamanya', badge: 'BEST VALUE', percentOfBase: 100, isDefault: true },
];

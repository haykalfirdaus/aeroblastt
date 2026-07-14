/**
 * Premium command access. `basePrice` is the 30-day price; the "Permanen"
 * duration option costs 200% of it (pay double, own it forever) — the
 * inverse decoy structure from the rank tiers, preserved from the original.
 */
export const COMMANDS = [
  {
    key: 'FLY',
    name: 'Fly',
    command: '/fly',
    icon: 'Feather',
    accent: 'cmd-blue',
    basePrice: 30000,
    description: 'Terbang bebas di seluruh server tanpa batas!',
    orderLabel: '/fly — FLY',
  },
  {
    key: 'GOD',
    name: 'God Mode',
    command: '/god',
    icon: 'Zap',
    accent: 'cmd-gold',
    basePrice: 30000,
    badge: 'BEST',
    description: 'Kebal dari segala damage! Tidak bisa mati selama aktif.',
    orderLabel: '/god — GOD MODE',
  },
  {
    key: 'FEED',
    name: 'Feed',
    command: '/feed',
    icon: 'Drumstick',
    accent: 'cmd-green',
    basePrice: 10000,
    description: 'Isi penuh hunger bar setiap saat kapan pun kamu mau.',
    orderLabel: '/feed — FEED',
  },
  {
    key: 'HEAL',
    name: 'Heal',
    command: '/heal',
    icon: 'Heart',
    accent: 'cmd-red',
    basePrice: 10000,
    description: 'Pulihkan HP penuh kapan saja kamu butuhkan.',
    orderLabel: '/heal — HEAL',
  },
  {
    key: 'TP',
    name: 'Teleport',
    command: '/tp [player]',
    icon: 'DoorOpen',
    accent: 'cmd-purple',
    basePrice: 20000,
    description: 'Teleport ke player manapun di server secara langsung.',
    orderLabel: '/tp — TELEPORT',
  },
  {
    key: 'REPAIR',
    name: 'Repair',
    command: '/repair',
    icon: 'Wrench',
    accent: 'cmd-orange',
    basePrice: 10000,
    description: 'Repair item yang kamu pegang secara instan tanpa anvil.',
    orderLabel: '/repair — REPAIR',
  },
  {
    key: 'INVSEE',
    name: 'Invsee',
    command: '/invsee [player]',
    icon: 'Eye',
    accent: 'cmd-cyan',
    basePrice: 25000,
    description: 'Lihat inventory player lain kapan saja.',
    orderLabel: '/invsee — INVSEE',
  },
  {
    key: 'UTILITY',
    name: 'Utility Pack',
    command: '/anvil • /ec • /wb',
    icon: 'Briefcase',
    accent: 'cmd-teal',
    basePrice: 15000,
    bundle: true,
    bundleTag: 'BUNDLE 3-IN-1',
    description: 'Akses Anvil, Ender Chest, dan Workbench portabel kapan saja!',
    bundleItems: ['/anvil', '/ec', '/wb'],
    orderLabel: '/anvil + /ec + /wb — UTILITY PACK',
  },
];

/** Duration options for command purchases: cheap-looking 30-day vs. 2x-price permanent. */
export const COMMAND_DURATION_OPTIONS = [
  { id: 'monthly', label: '30 Hari', sub: 'Sementara', percentOfBase: 100, isDefault: false },
  { id: 'permanent', label: 'Permanen', sub: 'Aktif Selamanya', badge: 'BEST DEAL', percentOfBase: 200, isDefault: true },
];

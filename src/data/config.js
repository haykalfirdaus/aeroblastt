/**
 * Central, non-visual site configuration — server connection details,
 * payment business rules, and social links.
 *
 * SECURITY NOTES:
 * - voters.apiKey has been removed — the API key is now kept server-side
 *   in api/voters.js and read from the VOTERS_API_KEY environment variable.
 * - discounts are managed via the admin panel and fetched from /api/admin/discounts.
 */
export const SITE = {
  name: 'AeroBlast Network',
  domain: 'aeroblast.my.id',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://store.aeroblast.my.id',

  server: {
    ip: 'aeroblast.my.id',
    port: '25543',
    statusApi: 'https://api.mcsrvstat.us/2/aeroblast.my.id:25543',
  },

  waNumber: '628123731343',

  voters: {
    // API calls go through /api/voters (server-side) — no key in the bundle
    apiUrl: '/api/voters',
    voteUrl: 'https://minecraft-mp.com/server-s353091',
  },

  social: {
    whatsapp: 'https://chat.whatsapp.com/F1d5WMvuuiiGGhpPZdAI36',
    discord: 'https://discord.gg/rgRRnPS9cp',
    tiktok: 'https://www.tiktok.com/@aeroblast.my.id',
  },

  // countdown.events is intentionally empty — set active promos via the admin panel
  countdown: {
    enabled: false,
    timezone: 'WITA',
    events: [],
  },

  // Payment destinations. imgPath served from /public/payment.
  payment: {
    DANA:  { number: '087861633006', label: 'DANA',  imgPath: '/payment/dana.png' },
    GOPAY: { number: '087861633006', label: 'GoPay', imgPath: '/payment/gopay.png' },
    QRIS:  { number: null,          label: 'QRIS',  imgPath: '/payment/qris.png' },
  },

  platforms: ['Java Edition', 'Bedrock / PE'],
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tailwind v4 via postcss — Next.js picks it up automatically
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'crafatar.com' },
      { protocol: 'https', hostname: 'mc-heads.net' },
    ],
  },

  // Baseline zip aeroblastrank harus ikut ter-bundle di serverless function
  // (dibaca via fs oleh app/aeroblastrank/[file]/route.js sebagai fallback)
  outputFileTracingIncludes: {
    '/aeroblastrank/[file]': ['./aeroblastrank/*.zip'],
  },

  // Expose public env vars
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://store.aeroblast.my.id',
  },
};

export default nextConfig;

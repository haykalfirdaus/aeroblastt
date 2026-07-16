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

  // Expose public env vars
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://store.aeroblast.my.id',
  },
};

export default nextConfig;

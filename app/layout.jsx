import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerAuthProvider } from '@/context/PlayerAuthContext';
import { ServerConfigProvider } from '@/context/ServerConfigContext';
import { PageLoader } from '@/components/layout/PageLoader';
import { getServerConfig } from '@/lib/serverConfig';
import '../src/index.css';

/*
 * Soft UI typography. Variable names match the @theme tokens in index.css
 * (--font-sans / --font-display / --font-mono) so Tailwind's font-sans,
 * font-display and font-mono utilities resolve to the self-hosted files.
 *
 * PERF: `display: 'swap'` renders fallback text immediately rather than
 * blocking on the webfont, and next/font self-hosts + preloads the subset, so
 * there is no render-blocking request to fonts.googleapis.com and no layout
 * shift from a late-arriving face. Weights are pinned to only what is used —
 * every extra weight is another file to download.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'AeroBlast Network - Minecraft Server Indonesia Terbaik | Survival, Economy, PvP',
  description: 'AeroBlast Network: Minecraft Server Indonesia dengan fitur Survival Economy, Claim Land, Key Gacha, dan Skill RPG terlengkap. Dukung Java & Bedrock. Gabung sekarang di aeroblast.my.id!',
  keywords: 'minecraft server indonesia, minecraft survival, minecraft economy, aeroblast, server minecraft, minecraft java, minecraft bedrock, minecraft pe',
  authors: [{ name: 'AeroBlast Network' }],
  robots: 'index, follow',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://store.aeroblast.my.id'),
  openGraph: {
    type: 'website',
    url: '/',
    title: 'AeroBlast Network - Minecraft Server Indonesia',
    description: 'Server Minecraft Indonesia terbaik dengan fitur lengkap dan komunitas aktif!',
    images: [{ url: '/icon-512.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AeroBlast Network - Minecraft Server Indonesia',
    description: 'Server Minecraft Indonesia terbaik dengan fitur lengkap dan komunitas aktif!',
    images: ['/icon-512.png'],
  },
  icons: {
    // ?v=2 memaksa browser membuang cache favicon lama
    icon: '/favicon-32.png?v=2',
    apple: '/apple-touch-icon.png?v=2',
  },
};

export const viewport = {
  themeColor: '#fff8f0',
  // maximumScale/userScalable removed — blocking pinch-zoom fails WCAG 1.4.4
  // and Lighthouse flags it. Users on small screens need to be able to zoom.
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  // Dibaca di server supaya IP/port sudah benar di HTML render pertama —
  // tidak ada flash nilai lama setelah hydration.
  const serverConfig = await getServerConfig();

  return (
    <html lang="id" className={`${jakarta.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/*
          The wallpaper preload was dropped: it is a decorative background used
          at 3–8% opacity, so fetching it at high priority competed with the
          LCP text and the font files for early bandwidth.
        */}
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'AeroBlast Network',
              url: 'https://store.aeroblast.my.id',
              logo: 'https://store.aeroblast.my.id/icon-512.png',
              description: 'Minecraft Server Indonesia dengan fitur lengkap',
              sameAs: ['https://discord.gg/rgRRnPS9cp', 'https://www.tiktok.com/@aeroblast.my.id'],
            }),
          }}
        />
      </head>
      <body>
        <ServerConfigProvider value={serverConfig}>
          <ToastProvider>
            <AuthProvider>
              <PlayerAuthProvider>
                {/*
                  Rendered AFTER children so it layers on top without ever
                  gating them — the page underneath is complete and interactive
                  even if the loader misbehaves.
                */}
                {children}
                <PageLoader />
              </PlayerAuthProvider>
            </AuthProvider>
          </ToastProvider>
        </ServerConfigProvider>
      </body>
    </html>
  );
}

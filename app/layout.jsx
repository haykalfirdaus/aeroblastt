import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerAuthProvider } from '@/context/PlayerAuthContext';
import { DevtoolsWarningOverlay } from '@/components/layout/DevtoolsWarningOverlay';
import '../src/index.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

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
    icon: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#030712',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preload" href="/wallpaper.webp" as="image" type="image/webp" fetchPriority="high" />
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
        <ToastProvider>
          <AuthProvider>
            <PlayerAuthProvider>
              <DevtoolsWarningOverlay />
              {children}
            </PlayerAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

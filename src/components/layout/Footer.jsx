'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Copy, Check, Home, ShoppingBag, Trophy, HelpCircle, FileText, MessageCircle, Phone, Server, Heart } from 'lucide-react';
import { SITE } from '@/data/config';
import { useServerConfig } from '@/context/ServerConfigContext';
import { useClipboard } from '@/hooks/useClipboard';
import { scrollToId } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * Soft UI footer — dark forest surface.
 *
 * Neumorphism needs its shadow pair to match the surface it sits on, so this
 * uses the `.neu-dark-*` variants (derived from #1d2b1f) rather than the cream
 * ones — reusing the cream pair here would paint a white halo.
 *
 * Logic untouched: useClipboard, useServerConfig, same-page section scroll.
 * The copyright year is still computed at render time.
 */

const LINKS = [
  { label: 'Beranda', to: '/', icon: Home, sectionId: 'home' },
  { label: 'Store', to: '/store', icon: ShoppingBag, sectionId: null },
  { label: 'Top Voters', to: '/top-voters', icon: Trophy, sectionId: null },
  { label: 'FAQ', to: '/faq', icon: HelpCircle, sectionId: null },
  { label: 'Syarat & Ketentuan', to: '/terms', icon: FileText, sectionId: null },
  { label: 'Donasi', to: '/donate', icon: Heart, sectionId: null },
];

export function Footer() {
  const [copiedKey, copy] = useClipboard();
  const server = useServerConfig();
  const pathname = usePathname();

  function handleLinkClick(e, link) {
    if (link.sectionId && pathname === '/') {
      e.preventDefault();
      scrollToId(link.sectionId);
    }
  }

  return (
    <footer className="neu-dark-surface cv-auto-sm relative bg-[#1d2b1f]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex min-h-[48px] w-fit items-center gap-2.5">
              <span className="neu-dark-out grid h-10 w-10 place-items-center rounded-[13px]">
                <Image src="/logo.png" alt="" width={26} height={26} className="rounded-lg object-cover" />
              </span>
              <span className="font-display text-sm font-extrabold text-[#fff8f0]">
                Aero<span className="text-[#BFFF5E]">Blast</span>
              </span>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-[#fff8f0]/85">
              Server Minecraft Indonesia dengan fitur lengkap dan komunitas aktif.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={SITE.social.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-dark-out inline-flex min-h-[48px] items-center gap-2 rounded-full px-4 text-xs font-bold text-[#fff8f0]/90 [transition:transform_150ms_ease] hover:text-[#BFFF5E] active:scale-[0.96]"
              >
                <MessageCircle size={13} aria-hidden="true" /> Discord
              </a>
              <a
                href={SITE.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="neu-dark-out inline-flex min-h-[48px] items-center gap-2 rounded-full px-4 text-xs font-bold text-[#fff8f0]/90 [transition:transform_150ms_ease] hover:text-[#BFFF5E] active:scale-[0.96]"
              >
                <Phone size={13} aria-hidden="true" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Nav */}
          <nav aria-label="Navigasi footer">
            <p className="mb-4 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#BFFF5E]">
              Navigasi
            </p>
            <ul className="flex flex-col gap-0.5">
              {LINKS.map((l) => {
                // "Donasi" no longer gets its own lime treatment — it is just
                // another page, and singling it out made it read as a separate
                // product from the rest of the site.
                return (
                  <li key={l.to}>
                    <Link
                      href={l.to}
                      onClick={(e) => handleLinkClick(e, l)}
                      className={cn(
                        'inline-flex min-h-[40px] items-center gap-2 rounded-full px-1 text-xs',
                        '[transition:transform_150ms_ease,color_150ms_ease] hover:translate-x-1',
                        'text-[#fff8f0]/85 hover:text-[#BFFF5E]'
                      )}
                    >
                      <l.icon size={13} className="text-[#fff8f0]/75" aria-hidden="true" />
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Server info — live values from useServerConfig */}
          <div>
            <p className="mb-4 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#BFFF5E]">
              <span className="inline-flex items-center gap-1.5">
                <Server size={11} aria-hidden="true" /> Join Server
              </span>
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'IP', value: server.ip, key: 'ip' },
                { label: 'Port', value: server.port, key: 'port' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="neu-dark-in flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[0.55rem] uppercase tracking-[0.16em] text-[#fff8f0]/75">
                      {item.label}
                    </p>
                    <p className="truncate font-mono text-xs font-bold text-[#fff8f0]">{item.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(item.value, item.key)}
                    className="neu-dark-out grid h-12 w-12 shrink-0 place-items-center rounded-full text-[#fff8f0]/85 [transition:transform_150ms_ease] hover:text-[#BFFF5E] active:scale-[0.94]"
                    aria-label={`Salin ${item.label} server`}
                  >
                    {copiedKey === item.key ? (
                      <Check size={15} className="text-[#BFFF5E]" aria-hidden="true" />
                    ) : (
                      <Copy size={15} aria-hidden="true" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-[0.65rem] text-[#fff8f0]/70">
          &copy; {new Date().getFullYear()} AeroBlast Network. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

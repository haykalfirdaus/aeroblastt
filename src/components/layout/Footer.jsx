'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Copy, Check, Home, ShoppingBag, Trophy, HelpCircle, FileText, MessageCircle, Phone, Server, Heart } from 'lucide-react';
import { SITE } from '@/data/config';
import { useClipboard } from '@/hooks/useClipboard';
import { scrollToId } from '@/lib/motion';
import { cn } from '@/lib/cn';
const logo = '/logo.png';

const LINKS = [
  { label: 'Beranda',            to: '/',           icon: Home,        sectionId: 'home' },
  { label: 'Store',              to: '/store',       icon: ShoppingBag, sectionId: null },
  { label: 'Top Voters',         to: '/top-voters',  icon: Trophy,      sectionId: null },
  { label: 'FAQ',                to: '/faq',         icon: HelpCircle,  sectionId: null },
  { label: 'Syarat & Ketentuan', to: '/terms',       icon: FileText,    sectionId: null },
  { label: 'Donasi',             to: '/donate',      icon: Heart,       sectionId: null },
];

export function Footer() {
  const [copiedKey, copy] = useClipboard();
  const pathname = usePathname();

  function handleLinkClick(e, link) {
    if (link.sectionId && pathname === '/') {
      e.preventDefault();
      scrollToId(link.sectionId);
    }
  }

  return (
    <footer className="relative border-t-2 border-[#1d2b1f] bg-[#1d2b1f]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <img src={logo} alt="AeroBlast" className="h-7 w-7 rounded-md object-cover border border-[#BFFF5E]/40" />
              <span className="font-display text-sm font-bold text-[#fff8f0]">
                Aero<span className="text-[#BFFF5E]">Blast</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[#fff8f0]/60 max-w-xs">
              Server Minecraft Indonesia dengan fitur lengkap dan komunitas aktif.
            </p>
            <div className="flex items-center gap-1.5">
              <a
                href={SITE.social.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-[#fff8f0]/20 px-3 py-1.5 text-xs text-[#fff8f0]/70 transition-all hover:border-[#BFFF5E] hover:text-[#BFFF5E]"
              >
                <MessageCircle size={11} /> Discord
              </a>
              <a
                href={SITE.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-[#fff8f0]/20 px-3 py-1.5 text-xs text-[#fff8f0]/70 transition-all hover:border-success/50 hover:text-success"
              >
                <Phone size={11} /> WhatsApp
              </a>
            </div>
          </div>

          {/* Nav Links */}
          <div>
            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-widest text-[#BFFF5E]/60">Navigasi</p>
            <ul className="flex flex-col gap-1.5">
              {LINKS.map((l) => {
                const isDonate = l.to === '/donate';
                return (
                  <li key={l.to}>
                    <Link
                      href={l.to}
                      onClick={(e) => handleLinkClick(e, l)}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs transition-all',
                        isDonate
                          ? 'font-bold text-[#BFFF5E] hover:text-[#d4ff80]'
                          : 'text-[#fff8f0]/65 hover:text-[#BFFF5E]'
                      )}
                    >
                      <l.icon size={11} className={isDonate ? 'text-[#BFFF5E]' : 'text-[#fff8f0]/40'} />
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Server Info */}
          <div>
            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-widest text-[#BFFF5E]/60">
              <span className="inline-flex items-center gap-1"><Server size={10} /> Join Server</span>
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'IP', value: SITE.server.ip, key: 'ip' },
                { label: 'Port', value: SITE.server.port, key: 'port' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-md border-2 border-[#fff8f0]/15 bg-[#fff8f0]/5 px-3 py-2.5"
                >
                  <div>
                    <p className="text-[0.55rem] uppercase tracking-widest text-[#fff8f0]/40">{item.label}</p>
                    <p className="font-mono text-xs font-semibold text-[#fff8f0]">{item.value}</p>
                  </div>
                  <button
                    onClick={() => copy(item.value, item.key)}
                    className="grid h-6 w-6 place-items-center rounded text-[#fff8f0]/40 transition-all hover:bg-[#BFFF5E]/20 hover:text-[#BFFF5E]"
                    aria-label={`Salin ${item.label}`}
                  >
                    {copiedKey === item.key ? <Check size={11} className="text-[#BFFF5E]" /> : <Copy size={11} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#fff8f0]/10 pt-5 text-center">
          <p className="text-[0.6rem] text-[#fff8f0]/30">&copy; {new Date().getFullYear()} AeroBlast Network. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

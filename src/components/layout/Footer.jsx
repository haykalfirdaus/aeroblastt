'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Copy, Check, Home, ShoppingBag, Trophy, HelpCircle, FileText, MessageCircle, Phone, Server } from 'lucide-react';
import { SITE } from '@/data/config';
import { useClipboard } from '@/hooks/useClipboard';
import { scrollToId } from '@/lib/motion';
const logo = '/logo.png';

const LINKS = [
  { label: 'Beranda',           to: '/',       icon: Home,        sectionId: 'home' },
  { label: 'Store',             to: '/store',  icon: ShoppingBag, sectionId: null },
  { label: 'Top Voters',        to: '/top-voters', icon: Trophy,  sectionId: null },
  { label: 'FAQ',               to: '/faq',    icon: HelpCircle,  sectionId: null },
  { label: 'Syarat & Ketentuan',to: '/terms',  icon: FileText,    sectionId: null },
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
    <footer className="relative border-t border-white/4 bg-abyss/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-7 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <img src={logo} alt="AeroBlast" className="h-7 w-7 rounded-lg object-cover shadow-[0_0_6px_rgba(59,130,246,0.14)]" />
              <span className="font-display text-sm font-bold text-text-bright">
                Aero<span className="text-neon-400">Blast</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-text-dim max-w-xs">
              Server Minecraft Indonesia dengan fitur lengkap dan komunitas aktif.
            </p>
            <div className="flex items-center gap-1.5">
              <a
                href={SITE.social.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/6 bg-white/2 px-2.5 py-1.5 text-xs text-text-muted transition-all hover:border-neon-400/20 hover:text-neon-300"
              >
                <MessageCircle size={11} /> Discord
              </a>
              <a
                href={SITE.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/6 bg-white/2 px-2.5 py-1.5 text-xs text-text-muted transition-all hover:border-success/20 hover:text-success-bright"
              >
                <Phone size={11} /> WhatsApp
              </a>
            </div>
          </div>

          {/* Nav Links */}
          <div>
            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-widest text-text-faint">Navigasi</p>
            <ul className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    href={l.to}
                    onClick={(e) => handleLinkClick(e, l)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-dim transition-all hover:text-neon-300"
                  >
                    <l.icon size={11} className="text-text-faint" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Server Info */}
          <div>
            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-widest text-text-faint">
              <span className="inline-flex items-center gap-1"><Server size={10} /> Join Server</span>
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'IP', value: SITE.server.ip, key: 'ip' },
                { label: 'Port', value: SITE.server.port, key: 'port' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.015] px-3 py-2"
                >
                  <div>
                    <p className="text-[0.55rem] uppercase tracking-widest text-text-faint">{item.label}</p>
                    <p className="font-mono text-xs font-semibold text-text-bright">{item.value}</p>
                  </div>
                  <button
                    onClick={() => copy(item.value, item.key)}
                    className="grid h-6 w-6 place-items-center rounded text-text-faint transition-all hover:text-neon-300"
                    aria-label={`Salin ${item.label}`}
                  >
                    {copiedKey === item.key ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/4 pt-5 text-center">
          <p className="text-[0.6rem] text-text-faint">&copy; {new Date().getFullYear()} AeroBlast Network. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Copy, Check, Home, ShoppingBag, Trophy, HelpCircle, FileText, MessageCircle, Phone, Server } from 'lucide-react';
import { SITE } from '@/data/config';
import { useClipboard } from '@/hooks/useClipboard';
import { scrollToId } from '@/lib/motion';
const logo = '/logo.png';

const LINKS = [
  { label: 'Beranda',            to: '/',           icon: Home,        sectionId: 'home' },
  { label: 'Store',              to: '/store',       icon: ShoppingBag, sectionId: null },
  { label: 'Top Voters',         to: '/top-voters',  icon: Trophy,      sectionId: null },
  { label: 'FAQ',                to: '/faq',         icon: HelpCircle,  sectionId: null },
  { label: 'Syarat & Ketentuan', to: '/terms',       icon: FileText,    sectionId: null },
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
    <footer className="relative border-t border-[#D8D1C0] bg-[#EDE8DA]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <img src={logo} alt="AeroBlast" className="h-7 w-7 rounded-lg object-cover shadow-[0_0_8px_rgba(180,224,53,0.2)]" />
              <span className="font-display text-sm font-bold text-[#1A2E1A]">
                Aero<span className="text-[#8AB024]">Blast</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-[#6B7F5A] max-w-xs">
              Server Minecraft Indonesia dengan fitur lengkap dan komunitas aktif.
            </p>
            <div className="flex items-center gap-1.5">
              <a
                href={SITE.social.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D8D1C0] bg-[#FAFAF7] px-3 py-1.5 text-xs text-[#6B7F5A] transition-all hover:border-[#B4E035]/40 hover:text-[#748F1C]"
              >
                <MessageCircle size={11} /> Discord
              </a>
              <a
                href={SITE.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D8D1C0] bg-[#FAFAF7] px-3 py-1.5 text-xs text-[#6B7F5A] transition-all hover:border-success/30 hover:text-success"
              >
                <Phone size={11} /> WhatsApp
              </a>
            </div>
          </div>

          {/* Nav Links */}
          <div>
            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-widest text-[#8A9E7A]">Navigasi</p>
            <ul className="flex flex-col gap-1.5">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    href={l.to}
                    onClick={(e) => handleLinkClick(e, l)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#6B7F5A] transition-all hover:text-[#748F1C]"
                  >
                    <l.icon size={11} className="text-[#8A9E7A]" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Server Info */}
          <div>
            <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-widest text-[#8A9E7A]">
              <span className="inline-flex items-center gap-1"><Server size={10} /> Join Server</span>
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'IP', value: SITE.server.ip, key: 'ip' },
                { label: 'Port', value: SITE.server.port, key: 'port' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-[#D8D1C0] bg-[#FAFAF7] px-3 py-2.5"
                >
                  <div>
                    <p className="text-[0.55rem] uppercase tracking-widest text-[#8A9E7A]">{item.label}</p>
                    <p className="font-mono text-xs font-semibold text-[#1A2E1A]">{item.value}</p>
                  </div>
                  <button
                    onClick={() => copy(item.value, item.key)}
                    className="grid h-6 w-6 place-items-center rounded-lg text-[#8A9E7A] transition-all hover:bg-[#E8E3D4] hover:text-[#748F1C]"
                    aria-label={`Salin ${item.label}`}
                  >
                    {copiedKey === item.key ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#D8D1C0] pt-5 text-center">
          <p className="text-[0.6rem] text-[#8A9E7A]">&copy; {new Date().getFullYear()} AeroBlast Network. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

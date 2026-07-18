'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, ShoppingBag, Trophy, HelpCircle, MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { scrollToId } from '@/lib/motion';
const logo = '/logo.png';

const NAV_LINKS = [
  { to: '/', label: 'Beranda', exact: true, icon: Home,        sectionId: 'home' },
  { to: '/store', label: 'Store',             icon: ShoppingBag, sectionId: null },
  { to: '/top-voters', label: 'Top Voters',   icon: Trophy,      sectionId: null },
  { to: '/faq', label: 'FAQ',                 icon: HelpCircle,  sectionId: null },
  { to: '/donate', label: 'Donasi',           icon: Heart,       sectionId: null },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleNavClick(e, link) {
    if (link.sectionId && pathname === '/') {
      e.preventDefault();
      setOpen(false);
      scrollToId(link.sectionId);
    }
  }

  return (
    <header
      ref={menuRef}
      className={cn(
        'fixed inset-x-0 top-0 z-[100] transition-all duration-300',
        scrolled
          ? 'border-b border-[#D8D1C0] bg-[#EDE8DA]/92 shadow-[0_2px_16px_-4px_rgba(26,46,26,0.1)] backdrop-blur-xl'
          : 'bg-transparent backdrop-blur-none'
      )}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="AeroBlast Network Home">
          <div className="logo-orbit-wrapper">
            <span className="orbit-star" aria-hidden="true" />
            <span className="orbit-star" aria-hidden="true" />
            <span className="orbit-star" aria-hidden="true" />
            <span className="orbit-star" aria-hidden="true" />
            <img
              src={logo}
              alt="AeroBlast logo"
              className="relative z-[1] h-7 w-7 rounded-lg object-cover shadow-[0_0_10px_rgba(180,224,53,0.2)]"
            />
          </div>
          <span className="hidden font-display text-sm font-bold tracking-tight text-[#1A2E1A] sm:block">
            Aero<span className="text-[#8AB024]">Blast</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1.5 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
            const isDonate = link.to === '/donate';
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={cn(
                  isDonate
                    ? 'inline-flex items-center gap-1.5 rounded-full border border-[#B4E035]/50 bg-[#B4E035]/15 px-3 py-1.5 text-xs font-bold text-[#748F1C] transition-all duration-150 hover:border-[#B4E035]/70 hover:bg-[#B4E035]/25'
                    : cn('nav-pill', isActive && 'nav-pill-active')
                )}
              >
                <link.icon size={11} className="shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Discord CTA */}
        <a
          href="https://discord.gg/rgRRnPS9cp"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-full border border-[#B4E035]/50 bg-[#B4E035]/10 px-4 py-1.5 text-xs font-bold text-[#748F1C] transition-all duration-150 hover:border-[#B4E035]/70 hover:bg-[#B4E035]/18 hover:shadow-[0_0_12px_rgba(180,224,53,0.2)] md:flex"
        >
          <MessageCircle size={11} />
          Discord
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-full border border-[#D8D1C0] text-[#6B7F5A] transition-all hover:border-[#1A2E1A]/25 hover:bg-[#EDE8DA] hover:text-[#1A2E1A] md:hidden"
        >
          {open ? <X size={14} /> : <Menu size={14} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-250 md:hidden',
          open ? 'max-h-72 border-b border-[#D8D1C0] bg-[#EDE8DA]/95 backdrop-blur-xl' : 'max-h-0'
        )}
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
          {NAV_LINKS.map((link) => {
            const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
            const isDonate = link.to === '/donate';
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={cn(
                  'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-semibold transition-all',
                  isDonate
                    ? 'border border-[#B4E035]/50 bg-[#B4E035]/15 text-[#748F1C] font-bold'
                    : isActive
                    ? 'border border-[#B4E035]/50 bg-[#B4E035]/12 text-[#748F1C]'
                    : 'border border-transparent text-[#6B7F5A] hover:border-[#D8D1C0] hover:bg-[#E8E3D4] hover:text-[#1A2E1A]'
                )}
              >
                <link.icon size={13} />
                {link.label}
              </Link>
            );
          })}
          <a
            href="https://discord.gg/rgRRnPS9cp"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2.5 rounded-full border border-[#B4E035]/50 bg-[#B4E035]/10 px-4 py-2.5 text-xs font-bold text-[#748F1C]"
          >
            <MessageCircle size={13} />
            Discord
          </a>
        </div>
      </div>
    </header>
  );
}

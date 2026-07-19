'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, ShoppingBag, Trophy, HelpCircle, MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { scrollToId } from '@/lib/motion';
import { useServerStatus } from '@/hooks/useServerStatus';
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
  const status = useServerStatus();

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
        'fixed inset-x-0 top-0 z-[100] transition-all duration-200',
        scrolled
          ? 'border-b-2 border-[#1d2b1f] bg-[#fff8f0]/95 backdrop-blur-md'
          : 'bg-transparent'
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
              className="relative z-[1] h-7 w-7 rounded-md object-cover border border-[#1d2b1f]"
            />
          </div>
          <span className="hidden font-display text-sm font-bold tracking-tight text-[#1d2b1f] sm:block">
            Aero<span className="text-[#5a9e10]">Blast</span>
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
                    ? 'inline-flex items-center gap-1.5 rounded-md border-2 border-[#1d2b1f] bg-[#BFFF5E] px-3 py-1.5 text-xs font-bold text-[#1d2b1f] shadow-[2px_2px_0_#1d2b1f] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
                    : cn('nav-pill', isActive && 'nav-pill-active')
                )}
              >
                <link.icon size={11} className="shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: server status + Join Now */}
        <div className="hidden items-center gap-2 md:flex">
          {status.online && (
            <div className="flex items-center gap-1.5 rounded-md border-2 border-[#1d2b1f] bg-[#BFFF5E]/20 px-3 py-1.5 text-xs font-bold text-[#1d2b1f]">
              <span className="glow-dot-green" />
              Online: {status.players?.online ?? 0}
            </div>
          )}
          <a
            href={SITE_DISCORD}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border-2 border-[#1d2b1f] bg-[#BFFF5E] px-4 py-1.5 text-xs font-bold text-[#1d2b1f] shadow-[2px_2px_0_#1d2b1f] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <MessageCircle size={11} />
            Join Now
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-md border-2 border-[#1d2b1f] text-[#1d2b1f] transition-all hover:bg-[#BFFF5E] md:hidden"
        >
          {open ? <X size={14} /> : <Menu size={14} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-250 md:hidden',
          open ? 'max-h-80 border-b-2 border-[#1d2b1f] bg-[#fff8f0]/98' : 'max-h-0'
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
                  'flex items-center gap-2.5 rounded-md border-2 px-4 py-2.5 text-xs font-semibold transition-all',
                  isDonate
                    ? 'border-[#1d2b1f] bg-[#BFFF5E] text-[#1d2b1f] font-bold'
                    : isActive
                    ? 'border-[#1d2b1f] bg-[#BFFF5E]/20 text-[#1d2b1f] font-bold'
                    : 'border-[#1d2b1f]/25 text-[#4a5e3a] hover:border-[#1d2b1f] hover:bg-[#f5ede0] hover:text-[#1d2b1f]'
                )}
              >
                <link.icon size={13} />
                {link.label}
              </Link>
            );
          })}
          {status.online && (
            <div className="mt-1 flex items-center gap-1.5 rounded-md border-2 border-[#1d2b1f] bg-[#BFFF5E]/15 px-4 py-2 text-xs font-bold text-[#1d2b1f]">
              <span className="glow-dot-green" />
              Online: {status.players?.online ?? 0} Players
            </div>
          )}
          <a
            href={SITE_DISCORD}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2.5 rounded-md border-2 border-[#1d2b1f] bg-[#BFFF5E] px-4 py-2.5 text-xs font-bold text-[#1d2b1f] shadow-[2px_2px_0_#1d2b1f]"
          >
            <MessageCircle size={13} />
            Join Now (Discord)
          </a>
        </div>
      </div>
    </header>
  );
}

const SITE_DISCORD = 'https://discord.gg/rgRRnPS9cp';

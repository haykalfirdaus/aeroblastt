'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, ShoppingBag, Trophy, HelpCircle, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { scrollToId } from '@/lib/motion';
import logo from '@/assets/images/logo.png';

const NAV_LINKS = [
  { to: '/', label: 'Beranda', exact: true, icon: Home,        sectionId: 'home' },
  { to: '/store', label: 'Store',             icon: ShoppingBag, sectionId: null },
  { to: '/top-voters', label: 'Top Voters',   icon: Trophy,      sectionId: null },
  { to: '/faq', label: 'FAQ',                 icon: HelpCircle,  sectionId: null },
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
          ? 'border-b border-white/6 bg-deep/80 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl'
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
              className="relative z-[1] h-7 w-7 rounded-lg object-cover shadow-[0_0_10px_rgba(59,130,246,0.25)]"
            />
          </div>
          <span className="hidden font-display text-sm font-bold tracking-tight text-text-bright sm:block">
            Aero<span className="text-neon-400">Blast</span>
          </span>
        </Link>

        {/* Desktop nav — pill-shaped links */}
        <div className="hidden items-center gap-1.5 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={cn('nav-pill', isActive && 'nav-pill-active')}
              >
                <link.icon size={11} className="shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Discord CTA — pill */}
        <a
          href="https://discord.gg/rgRRnPS9cp"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-full border border-neon-500/30 bg-neon-500/10 px-4 py-1.5 text-xs font-black text-neon-300 transition-all duration-150 hover:border-neon-400/50 hover:bg-neon-500/18 hover:shadow-[0_0_12px_rgba(59,130,246,0.25)] md:flex"
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
          className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-text-muted transition-all hover:border-white/25 hover:bg-white/5 hover:text-text-bright md:hidden"
        >
          {open ? <X size={14} /> : <Menu size={14} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-250 md:hidden',
          open ? 'max-h-72 border-b border-white/6 bg-deep/90 backdrop-blur-xl' : 'max-h-0'
        )}
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
          {NAV_LINKS.map((link) => {
            const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={cn(
                  'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'border border-neon-500/30 bg-neon-500/10 text-neon-300'
                    : 'border border-transparent text-text-muted hover:border-white/12 hover:bg-white/5 hover:text-text-bright'
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
            className="mt-1 flex items-center gap-2.5 rounded-full border border-neon-500/30 bg-neon-500/10 px-4 py-2.5 text-xs font-black text-neon-300"
          >
            <MessageCircle size={13} />
            Discord
          </a>
        </div>
      </div>
    </header>
  );
}

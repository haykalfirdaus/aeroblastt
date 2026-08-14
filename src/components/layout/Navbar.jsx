'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, ShoppingBag, Trophy, HelpCircle, MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { scrollToId } from '@/lib/motion';
import { useServerStatus } from '@/hooks/useServerStatus';
import { SITE } from '@/data/config';

/**
 * Soft UI navbar — floating pill.
 *
 * Logic preserved verbatim: scroll state, route-change close, click-outside,
 * same-page section scroll, and the live useServerStatus() badge.
 *
 * PERF / a11y changes:
 *  - `<img>` → `next/image` with explicit width/height, so the logo reserves
 *    its box before load. An unsized logo in a sticky header is a classic CLS
 *    contributor.
 *  - The mobile drawer no longer animates `max-height`. That tweens a layout
 *    property, forcing reflow every frame of the open/close. It now toggles
 *    outright and the panel itself fades/slides via transform+opacity.
 *  - Every target is ≥48px (the old hamburger was 32×32 — below the minimum).
 *  - Discord URL now reads from SITE.social rather than a duplicated literal.
 */

const NAV_LINKS = [
  { to: '/', label: 'Beranda', exact: true, icon: Home, sectionId: 'home' },
  { to: '/store', label: 'Store', icon: ShoppingBag, sectionId: null },
  { to: '/top-voters', label: 'Top Voters', icon: Trophy, sectionId: null },
  { to: '/faq', label: 'FAQ', icon: HelpCircle, sectionId: null },
  { to: '/donate', label: 'Donasi', icon: Heart, sectionId: null },
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <header ref={menuRef} className="fixed inset-x-0 top-0 z-[100] px-3 pt-3 sm:px-5">
      <nav
        className={cn(
          'mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-full px-3 py-2 sm:px-4',
          '[transition:box-shadow_200ms_ease,background-color_200ms_ease]',
          scrolled ? 'bg-[#fff8f0] shadow-[var(--neu-out)]' : 'bg-transparent'
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex min-h-[48px] shrink-0 items-center gap-2.5"
          aria-label="AeroBlast Network Beranda"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#fff8f0] shadow-[var(--neu-out)]">
            <Image
              src="/logo.png"
              alt=""
              width={26}
              height={26}
              className="rounded-lg object-cover"
              priority
            />
          </span>
          <span className="hidden font-display text-sm font-extrabold tracking-tight text-[#1d2b1f] sm:block">
            Aero<span className="text-[#3d7208]">Blast</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
            const isDonate = link.to === '/donate';
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={(e) => handleNavClick(e, link)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-[48px] items-center gap-1.5 rounded-full px-4 text-xs font-bold',
                  'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease,color_150ms_ease]',
                  'active:scale-[0.96]',
                  isDonate
                    ? 'neu-lime'
                    : isActive
                      ? 'bg-[#fff8f0] text-[#1d2b1f] shadow-[var(--neu-in)]'
                      : 'text-[#4a5e3a] hover:text-[#1d2b1f] hover:shadow-[var(--neu-out)]'
                )}
              >
                <link.icon size={13} className="shrink-0" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: live status + CTA */}
        <div className="hidden items-center gap-2 md:flex">
          {status.online && (
            <span className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#fff8f0] px-3.5 text-xs font-bold text-[#1d2b1f] shadow-[var(--neu-in)]">
              <span className="neu-dot-live h-2 w-2 rounded-full" aria-hidden="true" />
              Online: {status.players?.online ?? 0}
            </span>
          )}
          <a
            href={SITE.social.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="neu-lime neu-press inline-flex min-h-[48px] items-center gap-1.5 rounded-full px-5 text-xs font-extrabold"
          >
            <MessageCircle size={13} aria-hidden="true" />
            Join Now
          </a>
        </div>

        {/* Mobile hamburger — 48×48 */}
        <button
          type="button"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          onClick={() => setOpen((v) => !v)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff8f0] text-[#1d2b1f] shadow-[var(--neu-out)] [transition:transform_150ms_ease,box-shadow_150ms_ease] active:scale-[0.94] active:shadow-[var(--neu-in)] md:hidden"
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile drawer — no max-height tween (that reflows every frame) */}
      {open && (
        <div
          id="mobile-drawer"
          className="drawer-in mx-auto mt-2 w-full max-w-7xl rounded-[var(--radius-neu-xl)] bg-[#fff8f0] p-2 shadow-[var(--neu-out)] md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.exact ? pathname === link.to : pathname.startsWith(link.to);
              const isDonate = link.to === '/donate';
              return (
                <Link
                  key={link.to}
                  href={link.to}
                  onClick={(e) => handleNavClick(e, link)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[52px] items-center gap-2.5 rounded-[var(--radius-neu)] px-4 text-sm font-bold',
                    '[transition:transform_150ms_ease,box-shadow_150ms_ease] active:scale-[0.98]',
                    isDonate
                      ? 'neu-lime'
                      : isActive
                        ? 'bg-[#fff8f0] text-[#1d2b1f] shadow-[var(--neu-in)]'
                        : 'text-[#4a5e3a]'
                  )}
                >
                  <link.icon size={16} aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}

            {status.online && (
              <span className="mt-1 flex min-h-[48px] items-center gap-2 rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 text-xs font-bold text-[#1d2b1f] shadow-[var(--neu-in)]">
                <span className="neu-dot-live h-2 w-2 rounded-full" aria-hidden="true" />
                Online: {status.players?.online ?? 0} Players
              </span>
            )}

            <a
              href={SITE.social.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-lime mt-1 flex min-h-[52px] items-center gap-2.5 rounded-[var(--radius-neu)] px-4 text-sm font-extrabold"
            >
              <MessageCircle size={16} aria-hidden="true" />
              Join Now (Discord)
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

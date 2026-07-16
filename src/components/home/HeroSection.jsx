'use client';
import { useEffect, useRef } from 'react';
import { Copy, Check, ChevronRight, MessageCircle, Dot } from 'lucide-react';

const TICKER_FEATURES = [
  'Survival Economy', 'Claim Land', 'Key Gacha', 'Custom Rank',
  'Voting Rewards', 'Jobs System', 'Skill RPG', 'PlayerVault',
  'PvP Arena', 'Auction House', 'Daily Quest', 'Warp Publik',
];
import Link from 'next/link';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/Button';
import { useClipboard } from '@/hooks/useClipboard';
import { useServerStatus } from '@/hooks/useServerStatus';
import { prefersReducedMotion } from '@/lib/motion';
import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';
import logo from '@/assets/images/logo.png';

export function HeroSection() {
  const [copiedKey, copy] = useClipboard();
  const status = useServerStatus();
  const rootRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } });
      tl.from('[data-hero]', { opacity: 0, y: 18, stagger: 0.08 })
        .from('[data-hero-logo]', { opacity: 0, scale: 0.9, duration: 0.7, ease: 'power2.out' }, '-=0.5');
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="home"
      className="relative flex min-h-[88vh] items-center overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8"
    >
      {/* Hero-only wallpaper — darkened & mask-faded into the grid shell */}
      <div className="hero-bg" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-14">
          {/* Left: text */}
          <div className="flex flex-1 flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            {/* Status pill */}
            <div
              data-hero
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-bold backdrop-blur-sm transition-all duration-300',
                status.state === 'online'
                  ? 'badge-online text-success-bright'
                  : 'border-white/10 bg-white/[0.04] text-text-muted'
              )}
            >
              <span
                className={cn(
                  status.state === 'online' ? 'glow-dot-green' : 'h-1.5 w-1.5 rounded-full bg-text-dim'
                )}
              />
              {status.state === 'loading' && 'Mengecek status server...'}
              {status.state === 'online' &&
                `Server Online · ${status.players?.online ?? 0}/${status.players?.max ?? 0} Players`}
              {(status.state === 'offline' || status.state === 'error') && 'Server Sedang Offline'}
            </div>

            {/* Heading */}
            <div>
              <h1 data-hero className="font-impact leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(2.6rem, 8vw, 5rem)' }}>
                <span className="text-shimmer block">AEROBLAST</span>
                <span className="block text-text-bright">NETWORK</span>
              </h1>
              <p data-hero className="mt-4 max-w-md text-sm leading-relaxed text-text-muted">
                Minecraft Server Indonesia dengan fitur lengkap — Survival, Economy, Jobs, Quest, PvP Arena, Gacha, dan masih banyak lagi.
              </p>
            </div>

            {/* CTA buttons */}
            <div data-hero className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/store">
                <Button size="md">
                  Buka Store <ChevronRight size={14} />
                </Button>
              </Link>
              <a href={SITE.social.discord} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="md">
                  <MessageCircle size={14} /> Discord
                </Button>
              </a>
            </div>

            {/* IP copy row */}
            <div data-hero className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: 'IP', value: SITE.server.ip, key: 'ip' },
                { label: 'Port', value: SITE.server.port, key: 'port' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => copy(item.value, item.key)}
                  className="hw-transition flex items-center gap-2 rounded-full border border-white/14 bg-white/[0.04] px-4 py-2 backdrop-blur-sm transition-all duration-150 hover:border-neon-400/40 hover:bg-neon-500/6 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                >
                  <span className="text-[0.6rem] font-black uppercase tracking-widest text-text-dim">{item.label}</span>
                  <span className="font-mono text-xs font-bold text-text-bright">{item.value}</span>
                  {copiedKey === item.key ? (
                    <Check size={12} className="text-success-bright" />
                  ) : (
                    <Copy size={12} className="text-text-dim" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scrolling ticker — mobile only */}
          <div className="w-full overflow-hidden lg:hidden" aria-hidden="true">
            <div className="flex w-max items-center gap-0" style={{ animation: 'marquee 22s linear infinite' }}>
              {[...TICKER_FEATURES, ...TICKER_FEATURES].map((feat, i) => (
                <span key={i} className="inline-flex items-center font-sans text-[0.65rem] font-black uppercase tracking-wider text-neon-300/70">
                  {feat}
                  <Dot size={14} className="text-neon-500/35" />
                </span>
              ))}
            </div>
          </div>

          {/* Right: logo */}
          <div data-hero-logo className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-neon-500/8 blur-2xl" aria-hidden="true" />
            <div className="relative h-36 w-36 sm:h-44 sm:w-44 lg:h-52 lg:w-52">
              <div className="absolute inset-0 rounded-full border border-neon-400/12 bg-gradient-to-br from-neon-700/12 to-cyan-700/6" />
              <img
                src={logo}
                alt="AeroBlast Network"
                className="animate-float relative z-10 h-full w-full rounded-full object-cover"
              />
              <div className="absolute inset-0 rounded-full ring-1 ring-neon-400/15" />
            </div>
          </div>
        </div>

        {/* Desktop ticker strip */}
        <div className="mt-12 hidden overflow-hidden border-y border-white/5 py-2.5 lg:block" aria-hidden="true">
          <div className="flex w-max items-center gap-0" style={{ animation: 'marquee 20s linear infinite' }}>
            {[...TICKER_FEATURES, ...TICKER_FEATURES].map((feat, i) => (
              <span key={i} className="inline-flex items-center font-sans text-[0.65rem] font-black uppercase tracking-wider text-neon-300/65">
                {feat}
                <Dot size={14} className="text-neon-500/35" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

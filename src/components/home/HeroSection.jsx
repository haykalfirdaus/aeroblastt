'use client';
import { Copy, Check, ChevronRight, MessageCircle, Dot, Swords } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useClipboard } from '@/hooks/useClipboard';
import { useServerStatus } from '@/hooks/useServerStatus';
import { SITE } from '@/data/config';
import { useServerConfig } from '@/context/ServerConfigContext';
import { cn } from '@/lib/cn';

/**
 * Hero — Soft UI.
 *
 * PERF: GSAP is gone. It was imported solely for a one-shot intro timeline
 * (fade + stagger), which is ~70KB of client JS to do what a CSS keyframe with
 * an animation-delay does for free. The intro now runs off `.hero-in` +
 * `--hero-i` (see index.css) — pure CSS, no hydration dependency, and it plays
 * even before React hydrates rather than waiting for an effect to fire.
 *
 * All data hooks are untouched: useClipboard, useServerStatus, useServerConfig.
 */

const TICKER_FEATURES = [
  'Survival Economy', 'Claim Land', 'Key Gacha', 'Custom Rank',
  'Voting Rewards', 'Jobs System', 'Skill RPG', 'PlayerVault',
  'PvP Arena', 'Auction House', 'Daily Quest', 'Warp Publik',
];

/* Soft floating orbs — replaces the hard pixel blocks. Transform-only motion. */
const ORBS = [
  { s: 96, left: '6%', top: '14%', delay: '0s' },
  { s: 54, left: '82%', top: '10%', delay: '-2.5s' },
  { s: 128, left: '68%', top: '58%', delay: '-4s' },
  { s: 40, left: '16%', top: '72%', delay: '-1.2s' },
];

export function HeroSection() {
  const [copiedKey, copy] = useClipboard();
  const status = useServerStatus();
  const server = useServerConfig();

  return (
    <section
      id="home"
      className="relative flex min-h-[90vh] items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8"
    >
      <div className="hero-bg" aria-hidden="true">
        {ORBS.map((o, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="neu-orb animate-float"
            style={{ width: o.s, height: o.s, left: o.left, top: o.top, animationDelay: o.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/*
          Single centred column. The pixel-art Minecraft house that used to sit
          on the right is gone, so a two-column split would leave dead space.
        */}
        <div className="flex flex-col items-center gap-12">

          <div className="flex max-w-2xl flex-col items-center gap-6 text-center">

            <div className="hero-in neu-chip" style={{ '--hero-i': 0 }}>
              <Swords size={13} className="text-[#3d7208]" aria-hidden="true" />
              Minecraft Server Indonesia
            </div>

            {/* Server status — live data, unchanged */}
            <div
              className="hero-in inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#fff8f0] px-4 py-2 text-[0.72rem] font-bold shadow-[var(--neu-in)]"
              style={{ '--hero-i': 1 }}
            >
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  status.state === 'online' ? 'neu-dot-live' : 'bg-[#5a7048]'
                )}
                aria-hidden="true"
              />
              <span className={status.state === 'online' ? 'text-[#046b4d]' : 'text-[#4a5e3a]'}>
                {status.state === 'loading' && 'Mengecek status server...'}
                {status.state === 'online' &&
                  `Online · ${status.players?.online ?? 0}/${status.players?.max ?? 0} pemain`}
                {(status.state === 'offline' || status.state === 'error') && 'Server Sedang Offline'}
              </span>
            </div>

            <div className="hero-in" style={{ '--hero-i': 2 }}>
              <h1
                className="font-display font-extrabold leading-[1.02] tracking-tight text-[#1d2b1f]"
                style={{ fontSize: 'clamp(2.4rem, 7vw, 4.4rem)' }}
              >
                Server Terbaik untuk<br />
                <span className="text-[#3d7208]">Petualanganmu</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#4a5e3a]">
                Minecraft Server Indonesia dengan fitur lengkap — Survival, Economy, Jobs, Quest, PvP Arena, Gacha, dan masih banyak lagi.
              </p>
            </div>

            <div
              className="hero-in flex flex-wrap items-center justify-center gap-3 lg:justify-start"
              style={{ '--hero-i': 3 }}
            >
              <Button as={Link} href="/store" size="lg">
                Buka Store <ChevronRight size={16} aria-hidden="true" />
              </Button>
              <Button
                as="a"
                href={SITE.social.discord}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="lg"
              >
                <MessageCircle size={16} aria-hidden="true" /> Discord
              </Button>
            </div>

            {/* IP / Port copy — useClipboard untouched */}
            <div
              className="hero-in flex flex-wrap items-center justify-center gap-2 lg:justify-start"
              style={{ '--hero-i': 4 }}
            >
              {[
                { label: 'IP', value: server.ip, key: 'ip' },
                { label: 'Port', value: server.port, key: 'port' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => copy(item.value, item.key)}
                  aria-label={`Salin ${item.label} server`}
                  className="neu-press flex min-h-[48px] items-center gap-2 rounded-full bg-[#fff8f0] px-5 shadow-[var(--neu-out)]"
                >
                  <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#5a7048]">
                    {item.label}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#1d2b1f]">{item.value}</span>
                  {copiedKey === item.key ? (
                    <Check size={13} className="text-[#046b4d]" aria-hidden="true" />
                  ) : (
                    <Copy size={13} className="text-[#5a7048]" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile ticker */}
          <div className="w-full overflow-hidden lg:hidden" aria-hidden="true">
            <div className="marquee-track flex w-max items-center" style={{ animationDuration: '22s' }}>
              {[...TICKER_FEATURES, ...TICKER_FEATURES].map((feat, i) => (
                <span
                  key={i}
                  className="inline-flex items-center font-sans text-[0.65rem] font-bold uppercase tracking-wider text-[#1d2b1f]/70"
                >
                  {feat}
                  <Dot size={14} className="text-[#a8f040]" />
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Desktop ticker — no rules above/below, the marquee stands alone */}
        <div className="mt-14 hidden overflow-hidden py-3 lg:block" aria-hidden="true">
          <div className="marquee-track flex w-max items-center" style={{ animationDuration: '20s' }}>
            {[...TICKER_FEATURES, ...TICKER_FEATURES].map((feat, i) => (
              <span
                key={i}
                className="inline-flex items-center font-sans text-[0.65rem] font-bold uppercase tracking-wider text-[#4a5e3a]"
              >
                {feat}
                <Dot size={14} className="text-[#a8f040]" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

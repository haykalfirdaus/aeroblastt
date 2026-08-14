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

function MinecraftIllustration() {
  return (
    <svg
      viewBox="0 0 280 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="animate-float h-full w-full"
      style={{ maxWidth: 320 }}
    >
      <rect width="280" height="300" fill="#fff8f0" rx="16" />
      {/* Sun */}
      <rect x="226" y="22" width="16" height="16" fill="#F59E0B" />
      <rect x="230" y="14" width="8" height="8" fill="#FDE68A" />
      <rect x="230" y="38" width="8" height="8" fill="#FDE68A" />
      <rect x="218" y="26" width="8" height="4" fill="#FDE68A" />
      <rect x="242" y="26" width="8" height="4" fill="#FDE68A" />
      <rect x="232" y="24" width="4" height="8" fill="#FCD34D" />
      {/* Clouds */}
      <rect x="28" y="38" width="24" height="8" rx="2" fill="white" fillOpacity="0.75" />
      <rect x="24" y="42" width="32" height="8" rx="2" fill="white" fillOpacity="0.70" />
      <rect x="148" y="20" width="18" height="6" rx="2" fill="white" fillOpacity="0.70" />
      <rect x="144" y="24" width="26" height="6" rx="2" fill="white" fillOpacity="0.65" />
      {/* Hill */}
      <ellipse cx="140" cy="230" rx="145" ry="80" fill="#4a5e3a" />
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={`g${i}`} x={i * 20} y={188} width="20" height="10" fill="#7A9368" />
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={`d${i}`} x={i * 20} y={198} width="20" height="10" fill="#9A7B5A" />
      ))}
      {/* Tree */}
      <rect x="48" y="148" width="16" height="44" fill="#8B5E1A" />
      <rect x="52" y="152" width="4" height="12" fill="#7A5218" />
      {[
        [30, 118, 56, 30], [86, 118, 56, 30],
        [22, 100, 72, 24], [94, 100, 72, 24],
        [38, 84, 60, 22], [90, 84, 60, 22],
        [46, 70, 64, 20],
      ].map(([x, y, w, h], i) => (
        <rect key={`c${i}`} x={x} y={y} width={w} height={h} fill={i % 2 === 0 ? '#4A7A25' : '#5D9E30'} />
      ))}
      <rect x="67" y="188" width="4" height="6" fill="#4a5e3a" />
      <rect x="64" y="184" width="10" height="8" rx="4" fill="#BFFF5E" />
      {/* House */}
      {Array.from({ length: 6 }).map((_, col) =>
        Array.from({ length: 5 }).map((_, row) => (
          <rect
            key={`${col}-${row}`}
            x={148 + col * 18}
            y={118 + row * 18}
            width="17"
            height="17"
            fill={col === 2 && row === 2 ? '#D0B896' : '#D4C5A0'}
            stroke="#C4B590"
            strokeWidth="0.5"
          />
        ))
      )}
      <rect x="174" y="128" width="22" height="18" fill="#A8CCEE" stroke="#8AAFCC" strokeWidth="1" />
      <line x1="185" y1="128" x2="185" y2="146" stroke="#8AAFCC" strokeWidth="1" />
      <line x1="174" y1="137" x2="196" y2="137" stroke="#8AAFCC" strokeWidth="1" />
      <rect x="206" y="154" width="14" height="26" fill="#8B6135" />
      <rect x="209" y="162" width="4" height="4" fill="#C49A4A" rx="2" />
      {[
        [140, 108, 108, 12], [148, 96, 92, 14], [158, 84, 72, 14],
        [166, 70, 56, 16], [176, 56, 36, 16],
      ].map(([x, y, w, h], i) => (
        <rect key={`r${i}`} x={x} y={y} width={w} height={h} fill={i % 2 === 0 ? '#7A5A1A' : '#8B6B26'} />
      ))}
      <rect x="148" y="94" width="4" height="14" fill="#C49A4A" opacity="0.4" />
      {/* Fence */}
      <rect x="120" y="178" width="3" height="12" fill="#9A8B72" />
      <rect x="128" y="178" width="3" height="12" fill="#9A8B72" />
      <rect x="136" y="178" width="3" height="12" fill="#9A8B72" />
      <rect x="119" y="180" width="22" height="2" fill="#9A8B72" />
      <rect x="119" y="186" width="22" height="2" fill="#9A8B72" />
      {/* Lime accents */}
      <rect x="240" y="65" width="12" height="12" fill="#BFFF5E" opacity="0.55" rx="1" transform="rotate(8 246 71)" />
      <rect x="20" y="165" width="10" height="10" fill="#BFFF5E" opacity="0.45" rx="1" transform="rotate(-6 25 170)" />
      <rect x="110" y="55" width="8" height="8" fill="#a8f040" opacity="0.50" rx="1" transform="rotate(12 114 59)" />
      {/* Creeper */}
      <rect x="56" y="140" width="12" height="14" fill="#5D9E30" />
      <rect x="58" y="142" width="3" height="3" fill="#1d2b1f" />
      <rect x="67" y="142" width="3" height="3" fill="#1d2b1f" />
      <rect x="60" y="147" width="8" height="2" fill="#1d2b1f" />
      <rect x="60" y="150" width="3" height="3" fill="#1d2b1f" />
      <rect x="65" y="150" width="3" height="3" fill="#1d2b1f" />
    </svg>
  );
}

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
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* Left: text */}
          <div className="flex flex-1 flex-col items-center gap-6 text-center lg:items-start lg:text-left">

            <div className="hero-in neu-chip" style={{ '--hero-i': 0 }}>
              <Swords size={13} className="text-[#5a9e10]" aria-hidden="true" />
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
              <span className={status.state === 'online' ? 'text-[#059669]' : 'text-[#4a5e3a]'}>
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
                <span className="text-[#5a9e10]">Petualanganmu</span>
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
                    <Check size={13} className="text-[#059669]" aria-hidden="true" />
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

          {/* Right: illustration in a soft raised frame */}
          <div
            className="hero-in relative w-full max-w-[320px] shrink-0 lg:max-w-[340px]"
            style={{ '--hero-i': 3 }}
          >
            <div className="relative rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-4 shadow-[var(--neu-out-lg)]">
              <MinecraftIllustration />
            </div>
          </div>
        </div>

        {/* Desktop ticker */}
        <div className="mt-14 hidden overflow-hidden py-3 lg:block" aria-hidden="true">
          <div className="neu-rule mb-3" />
          <div className="marquee-track flex w-max items-center" style={{ animationDuration: '20s' }}>
            {[...TICKER_FEATURES, ...TICKER_FEATURES].map((feat, i) => (
              <span
                key={i}
                className="inline-flex items-center font-sans text-[0.65rem] font-bold uppercase tracking-wider text-[#1d2b1f]/65"
              >
                {feat}
                <Dot size={14} className="text-[#a8f040]" />
              </span>
            ))}
          </div>
          <div className="neu-rule mt-3" />
        </div>
      </div>
    </section>
  );
}

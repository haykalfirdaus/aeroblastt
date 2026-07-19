'use client';
import { useEffect, useRef } from 'react';
import { Copy, Check, ChevronRight, MessageCircle, Dot, Swords } from 'lucide-react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/Button';
import { useClipboard } from '@/hooks/useClipboard';
import { useServerStatus } from '@/hooks/useServerStatus';
import { prefersReducedMotion } from '@/lib/motion';
import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const TICKER_FEATURES = [
  'Survival Economy', 'Claim Land', 'Key Gacha', 'Custom Rank',
  'Voting Rewards', 'Jobs System', 'Skill RPG', 'PlayerVault',
  'PvP Arena', 'Auction House', 'Daily Quest', 'Warp Publik',
];

/* Floating pixel-block decorations for the hero background */
const PIXEL_BLOCKS = [
  { w: 20, h: 20, left: '7%',  top: '17%', opacity: 0.12, color: '#BFFF5E', delay: '0s' },
  { w: 12, h: 12, left: '83%', top: '11%', opacity: 0.10, color: '#4a5e3a', delay: '-1.5s' },
  { w: 28, h: 28, left: '70%', top: '33%', opacity: 0.08, color: '#BFFF5E', delay: '-3.0s' },
  { w: 16, h: 16, left: '14%', top: '64%', opacity: 0.09, color: '#9A8B72', delay: '-2.0s' },
  { w: 24, h: 24, left: '58%', top: '68%', opacity: 0.07, color: '#4a5e3a', delay: '-4.5s' },
  { w: 10, h: 10, left: '88%', top: '56%', opacity: 0.11, color: '#BFFF5E', delay: '-0.5s' },
  { w: 18, h: 18, left: '40%', top: '7%',  opacity: 0.08, color: '#9A8B72', delay: '-2.5s' },
  { w: 14, h: 14, left: '28%', top: '80%', opacity: 0.06, color: '#BFFF5E', delay: '-3.5s' },
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
      {/* Sky wash */}
      <rect width="280" height="300" fill="#fff8f0" rx="16" />

      {/* Sun */}
      <rect x="226" y="22" width="16" height="16" fill="#F59E0B" />
      <rect x="230" y="14" width="8"  height="8"  fill="#FDE68A" />
      <rect x="230" y="38" width="8"  height="8"  fill="#FDE68A" />
      <rect x="218" y="26" width="8"  height="4"  fill="#FDE68A" />
      <rect x="242" y="26" width="8"  height="4"  fill="#FDE68A" />
      <rect x="232" y="24" width="4"  height="8"  fill="#FCD34D" />

      {/* Cloud A */}
      <rect x="28"  y="38" width="24" height="8"  rx="2" fill="white" fillOpacity="0.75" />
      <rect x="24"  y="42" width="32" height="8"  rx="2" fill="white" fillOpacity="0.70" />
      {/* Cloud B */}
      <rect x="148" y="20" width="18" height="6"  rx="2" fill="white" fillOpacity="0.70" />
      <rect x="144" y="24" width="26" height="6"  rx="2" fill="white" fillOpacity="0.65" />

      {/* Hill silhouette */}
      <ellipse cx="140" cy="230" rx="145" ry="80" fill="#4a5e3a" />

      {/* Grass top row */}
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={i * 20} y={188} width="20" height="10" fill="#7A9368" />
      ))}
      {/* Dirt row */}
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={i * 20} y={198} width="20" height="10" fill="#9A7B5A" />
      ))}

      {/* Tree trunk (left) */}
      <rect x="48" y="148" width="16" height="44" fill="#8B5E1A" />
      <rect x="52" y="152" width="4"  height="12" fill="#7A5218" />
      {/* Tree canopy */}
      {[
        [30,118,56,30],[86,118,56,30],
        [22,100,72,24],[94,100,72,24],
        [38,84, 60,22],[90,84, 60,22],
        [46,70, 64,20],
      ].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={i%2===0?'#4A7A25':'#5D9E30'} />
      ))}

      {/* Small flower */}
      <rect x="67" y="188" width="4" height="6" fill="#4a5e3a" />
      <rect x="64" y="184" width="10" height="8" rx="4" fill="#BFFF5E" />

      {/* House walls */}
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

      {/* Window (glass) */}
      <rect x="174" y="128" width="22" height="18" fill="#A8CCEE" stroke="#8AAFCC" strokeWidth="1" />
      <line x1="185" y1="128" x2="185" y2="146" stroke="#8AAFCC" strokeWidth="1" />
      <line x1="174" y1="137" x2="196" y2="137" stroke="#8AAFCC" strokeWidth="1" />

      {/* Door */}
      <rect x="206" y="154" width="14" height="26" fill="#8B6135" />
      <rect x="209" y="162" width="4" height="4" fill="#C49A4A" rx="2" />

      {/* Roof — stepped pixel pyramid */}
      {[
        [140, 108, 108, 12],
        [148,  96,  92, 14],
        [158,  84,  72, 14],
        [166,  70,  56, 16],
        [176,  56,  36, 16],
      ].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={i%2===0?'#7A5A1A':'#8B6B26'} />
      ))}
      {/* Roof highlight */}
      <rect x="148" y="94" width="4" height="14" fill="#C49A4A" opacity="0.4" />

      {/* Fence posts */}
      <rect x="120" y="178" width="3" height="12" fill="#9A8B72" />
      <rect x="128" y="178" width="3" height="12" fill="#9A8B72" />
      <rect x="136" y="178" width="3" height="12" fill="#9A8B72" />
      <rect x="119" y="180" width="22" height="2"  fill="#9A8B72" />
      <rect x="119" y="186" width="22" height="2"  fill="#9A8B72" />

      {/* Floating lime blocks around scene */}
      <rect x="240" y="65"  width="12" height="12" fill="#BFFF5E" opacity="0.55" rx="1" transform="rotate(8 246 71)"  />
      <rect x="20"  y="165" width="10" height="10" fill="#BFFF5E" opacity="0.45" rx="1" transform="rotate(-6 25 170)" />
      <rect x="110" y="55"  width="8"  height="8"  fill="#a8f040" opacity="0.50" rx="1" transform="rotate(12 114 59)" />

      {/* Creeper face (tiny, peeking from tree) */}
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
  const rootRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } });
      tl.from('[data-hero]', { opacity: 0, y: 18, stagger: 0.09 })
        .from('[data-hero-logo]', { opacity: 0, scale: 0.9, duration: 0.7, ease: 'power2.out' }, '-=0.5');
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="home"
      className="relative flex min-h-[90vh] items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-8"
    >
      {/* Warm cream background + ambient glow */}
      <div className="hero-bg" aria-hidden="true">
        {/* Floating pixel blocks */}
        {PIXEL_BLOCKS.map((b, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="animate-float absolute"
            style={{
              width: b.w,
              height: b.h,
              left: b.left,
              top: b.top,
              opacity: b.opacity,
              background: b.color,
              animationDelay: b.delay,
              borderRadius: 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* Left: text */}
          <div className="flex flex-1 flex-col items-center gap-6 text-center lg:items-start lg:text-left">

            {/* Badge pill */}
            <div data-hero className="inline-flex items-center gap-2 rounded-md border border-[#BFFF5E]/50 bg-[#BFFF5E]/12 px-4 py-1.5 text-[0.7rem] font-bold text-[#1d2b1f]">
              <Swords size={12} className="text-[#BFFF5E]" />
              Minecraft Server Indonesia
            </div>

            {/* Server status */}
            <div
              data-hero
              className={cn(
                'inline-flex items-center gap-2 rounded-md border border-[#1d2b1f]/30 px-3.5 py-1.5 text-[0.7rem] font-bold transition-all duration-300',
                status.state === 'online'
                  ? 'badge-online text-success'
                  : 'bg-[#f5ece0] text-[#4a5e3a]'
              )}
            >
              <span
                className={cn(
                  status.state === 'online'
                    ? 'glow-dot-green'
                    : 'h-1.5 w-1.5 rounded-md bg-[#D8D1C0]'
                )}
              />
              {status.state === 'loading' && 'Mengecek status server...'}
              {status.state === 'online' &&
                `Online · ${status.players?.online ?? 0}/${status.players?.max ?? 0} pemain`}
              {(status.state === 'offline' || status.state === 'error') && 'Server Sedang Offline'}
            </div>

            {/* Heading */}
            <div data-hero>
              <h1
                className="font-display font-extrabold leading-[1.0] tracking-tight text-[#1d2b1f]"
                style={{ fontSize: 'clamp(2.6rem, 7vw, 4.4rem)' }}
              >
                Server Terbaik untuk<br />
                <span className="text-[#BFFF5E]">Petualanganmu</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#4a5e3a]">
                Minecraft Server Indonesia dengan fitur lengkap — Survival, Economy, Jobs, Quest, PvP Arena, Gacha, dan masih banyak lagi.
              </p>
            </div>

            {/* CTA buttons */}
            <div data-hero className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/store">
                <Button size="lg">
                  Buka Store <ChevronRight size={16} />
                </Button>
              </Link>
              <a href={SITE.social.discord} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg">
                  <MessageCircle size={16} /> Discord
                </Button>
              </a>
            </div>

            {/* IP copy row */}
            <div data-hero className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {[
                { label: 'IP', value: SITE.server.ip, key: 'ip' },
                { label: 'Port', value: SITE.server.port, key: 'port' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => copy(item.value, item.key)}
                  className="hw-transition flex items-center gap-2 rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] px-4 py-2 transition-all duration-150 hover:border-[#BFFF5E]/50 hover:bg-[#f5ece0] hover:"
                >
                  <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#6b7f5a]">{item.label}</span>
                  <span className="font-mono text-xs font-bold text-[#1d2b1f]">{item.value}</span>
                  {copiedKey === item.key ? (
                    <Check size={12} className="text-success" />
                  ) : (
                    <Copy size={12} className="text-[#6b7f5a]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile ticker */}
          <div className="w-full overflow-hidden lg:hidden" aria-hidden="true">
            <div className="flex w-max items-center gap-0" style={{ animation: 'marquee 22s linear infinite' }}>
              {[...TICKER_FEATURES, ...TICKER_FEATURES].map((feat, i) => (
                <span key={i} className="inline-flex items-center font-sans text-[0.65rem] font-bold uppercase tracking-wider text-[#1d2b1f]/70">
                  {feat}
                  <Dot size={14} className="text-[#BFFF5E]/50" />
                </span>
              ))}
            </div>
          </div>

          {/* Right: Minecraft world illustration */}
          <div data-hero-logo className="relative shrink-0 w-full max-w-[320px] lg:max-w-[340px]">
            <div className="absolute -inset-6 rounded-md bg-[#BFFF5E]/5 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] p-4 shadow-[4px_4px_0_#1d2b1f]">
              <MinecraftIllustration />
            </div>
          </div>
        </div>

        {/* Desktop ticker strip */}
        <div className="mt-14 hidden overflow-hidden border-y border-2 border-[#1d2b1f] py-3 lg:block" aria-hidden="true">
          <div className="flex w-max items-center gap-0" style={{ animation: 'marquee 20s linear infinite' }}>
            {[...TICKER_FEATURES, ...TICKER_FEATURES].map((feat, i) => (
              <span key={i} className="inline-flex items-center font-sans text-[0.65rem] font-bold uppercase tracking-wider text-[#1d2b1f]/65">
                {feat}
                <Dot size={14} className="text-[#BFFF5E]/40" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

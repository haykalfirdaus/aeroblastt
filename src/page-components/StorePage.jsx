'use client';
import { useRef, useState } from 'react';
import {
  Medal, KeyRound, Zap, Coins, Terminal, Palette,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PlayerLoginPrompt } from '@/components/store/PlayerLoginPrompt';
import { RankTab } from '@/components/store/RankTab';
import { GachaKeysTab } from '@/components/store/GachaKeysTab';
import { SkillBoostTab } from '@/components/store/SkillBoostTab';
import { BalanceTab } from '@/components/store/BalanceTab';
import { CommandsTab } from '@/components/store/CommandsTab';
import { CosmeticsTab } from '@/components/store/CosmeticsTab';
import { cn } from '@/lib/cn';

const TABS = [
  { id: 'ranks',     label: 'Rank',        icon: Medal,    desc: 'Upgrade rank permanenmu' },
  { id: 'keys',      label: 'Gacha Keys',  icon: KeyRound, desc: 'Key untuk buka peti gacha' },
  { id: 'skills',    label: 'Skill Boost', icon: Zap,      desc: 'Boost skill in-game' },
  { id: 'balance',   label: 'Balance',     icon: Coins,    desc: 'Top-up balance in-game' },
  { id: 'commands',  label: 'Commands',    icon: Terminal, desc: 'Akses command premium' },
  { id: 'cosmetics', label: 'Cosmetics',   icon: Palette,  desc: 'Custom prefix & tampilan' },
];

const TAB_CONTENT = {
  ranks:     <RankTab />,
  keys:      <GachaKeysTab />,
  skills:    <SkillBoostTab />,
  balance:   <BalanceTab />,
  commands:  <CommandsTab />,
  cosmetics: <CosmeticsTab />,
};

const TAB_IDS = TABS.map((t) => t.id);

export default function StorePage() {
  const [activeTab, setActiveTab] = useState('ranks');
  const current = TABS.find((t) => t.id === activeTab);
  const swipeRef = useRef(null);
  const touchStartX = useRef(null);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return; // minimum swipe distance
    const idx = TAB_IDS.indexOf(activeTab);
    if (dx < 0 && idx < TAB_IDS.length - 1) setActiveTab(TAB_IDS[idx + 1]);
    if (dx > 0 && idx > 0) setActiveTab(TAB_IDS[idx - 1]);
  }

  return (
    <PageLayout>
      {/* Page header */}
      <div className="relative border-b border-[#D8D1C0] bg-[#EDE8DA] px-4 py-10 text-center sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-[#B4E035]/10 blur-3xl" />
        </div>
        <span data-aos="fade-down" data-aos-duration="600" className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#B4E035]/35 bg-[#B4E035]/10 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#748F1C]">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#B4E035]" />
          AeroBlast Store
        </span>
        <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="700" className="relative font-display text-2xl font-extrabold text-[#1A2E1A] sm:text-3xl">
          Toko In-Game Resmi
        </h1>
        <p data-aos="fade-up" data-aos-delay="200" data-aos-duration="700" className="relative mt-1.5 text-xs text-[#6B7F5A]">
          Semua pembelian diproses manual via WhatsApp dalam 1–10 menit.
        </p>
      </div>

      {/* Tab bar — desktop: dividers, mobile: horizontal chips */}
      <div className="sticky top-14 z-40 border-b border-[#D8D1C0] bg-[#EDE8DA]/95 backdrop-blur-sm">
        {/* Mobile: scrollable chips dengan fade indicator */}
        <div className="relative md:hidden">
          <div className="no-scrollbar flex overflow-x-auto px-3 py-2 gap-1.5">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-[#B4E035]/20 text-[#748F1C] ring-1 ring-[#B4E035]/40'
                      : 'bg-[#D8D1C0]/40 text-[#6B7F5A] hover:bg-[#D8D1C0]/70 hover:text-[#1A2E1A]'
                  )}
                >
                  <TabIcon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* Gradient fade kanan — indikator ada konten tersembunyi */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#EDE8DA] to-transparent" />
        </div>
        {/* Desktop: divider-separated tabs */}
        <div className="hidden md:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              {TABS.map((tab, idx) => {
                const TabIcon = tab.icon;
                return (
                  <div key={tab.id} className="flex items-center">
                    {idx > 0 && <div className="h-4 w-px bg-[#D8D1C0]" />}
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'group inline-flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2',
                        activeTab === tab.id
                          ? 'border-[#B4E035] text-[#748F1C]'
                          : 'border-transparent text-[#6B7F5A] hover:text-[#1A2E1A]'
                      )}
                    >
                      <TabIcon size={13} className={activeTab === tab.id ? 'text-[#B4E035]' : 'text-[#8A9E7A] group-hover:text-[#6B7F5A]'} />
                      {tab.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active tab content — swipeable di mobile */}
      <div
        ref={swipeRef}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <PlayerLoginPrompt />
        {current && (
          <div className="mb-6 flex items-center gap-2">
            <current.icon size={16} className="text-[#748F1C]" />
            <h2 className="font-display text-lg font-bold text-[#1A2E1A]">{current.label}</h2>
            <span className="text-[#6B7F5A]">·</span>
            <p className="text-xs text-[#6B7F5A]">{current.desc}</p>
          </div>
        )}
        {/* Dot indicator mobile */}
        <div className="mb-5 flex justify-center gap-1.5 md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-full transition-all',
                activeTab === tab.id
                  ? 'h-1.5 w-4 bg-[#B4E035]'
                  : 'h-1.5 w-1.5 bg-[#D8D1C0]'
              )}
            />
          ))}
        </div>
        <div key={activeTab} style={{ animation: 'page-wipe-in 0.28s cubic-bezier(0.22,1,0.36,1) both' }}>{TAB_CONTENT[activeTab]}</div>
      </div>
    </PageLayout>
  );
}

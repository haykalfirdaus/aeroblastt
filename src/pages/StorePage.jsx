import { useState } from 'react';
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

export default function StorePage() {
  const [activeTab, setActiveTab] = useState('ranks');
  const current = TABS.find((t) => t.id === activeTab);

  return (
    <PageLayout>
      {/* Page header */}
      <div className="page-header-bg border-b border-white/8 bg-gradient-to-b from-panel/60 to-transparent px-4 py-10 text-center sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-neon-600/12 blur-3xl" />
        </div>
        <span className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon-500/25 bg-neon-500/10 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-neon-300">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neon-400" />
          AeroBlast Store
        </span>
        <h1 className="relative font-display text-2xl font-extrabold text-text-bright sm:text-3xl">
          Toko In-Game Resmi
        </h1>
        <p className="relative mt-1.5 text-xs text-text-muted">
          Semua pembelian diproses manual via WhatsApp dalam 1–10 menit.
        </p>
      </div>

      {/* Tab bar — desktop: dividers, mobile: horizontal chips */}
      <div className="sticky top-14 z-40 border-b border-white/8 bg-abyss/90">
        {/* Mobile: scrollable chips */}
        <div className="no-scrollbar flex overflow-x-auto px-3 py-2 gap-1.5 md:hidden">
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
                    ? 'bg-neon-500/15 text-neon-300 ring-1 ring-neon-400/30'
                    : 'bg-white/4 text-text-muted hover:bg-white/8 hover:text-text-bright'
                )}
              >
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
        {/* Desktop: divider-separated tabs */}
        <div className="hidden md:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              {TABS.map((tab, idx) => {
                const TabIcon = tab.icon;
                return (
                  <div key={tab.id} className="flex items-center">
                    {idx > 0 && <div className="h-4 w-px bg-white/10" />}
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'group inline-flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2',
                        activeTab === tab.id
                          ? 'border-neon-400 text-neon-300'
                          : 'border-transparent text-text-muted hover:text-text-bright'
                      )}
                    >
                      <TabIcon size={13} className={activeTab === tab.id ? 'text-neon-400' : 'text-text-dim group-hover:text-text-muted'} />
                      {tab.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active tab content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PlayerLoginPrompt />
        {current && (
          <div className="mb-6 flex items-center gap-2">
            <current.icon size={16} className="text-neon-400" />
            <h2 className="font-display text-lg font-bold text-text-bright">{current.label}</h2>
            <span className="text-text-dim">·</span>
            <p className="text-xs text-text-muted">{current.desc}</p>
          </div>
        )}
        <div key={activeTab}>{TAB_CONTENT[activeTab]}</div>
      </div>
    </PageLayout>
  );
}

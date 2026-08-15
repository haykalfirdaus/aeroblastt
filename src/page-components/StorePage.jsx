'use client';
import { useRef, useState } from 'react';
import { Medal, KeyRound, Zap, Coins, Terminal, Palette } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PlayerLoginPrompt } from '@/components/store/PlayerLoginPrompt';
import { RankTab } from '@/components/store/RankTab';
import { GachaKeysTab } from '@/components/store/GachaKeysTab';
import { SkillBoostTab } from '@/components/store/SkillBoostTab';
import { BalanceTab } from '@/components/store/BalanceTab';
import { CommandsTab } from '@/components/store/CommandsTab';
import { CosmeticsTab } from '@/components/store/CosmeticsTab';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/cn';

const TABS = [
  { id: 'ranks', label: 'Rank', icon: Medal, desc: 'Upgrade rank permanenmu', Panel: RankTab },
  { id: 'keys', label: 'Gacha Keys', icon: KeyRound, desc: 'Key untuk buka peti gacha', Panel: GachaKeysTab },
  { id: 'skills', label: 'Skill Boost', icon: Zap, desc: 'Boost skill in-game', Panel: SkillBoostTab },
  { id: 'balance', label: 'Balance', icon: Coins, desc: 'Top-up balance in-game', Panel: BalanceTab },
  { id: 'commands', label: 'Commands', icon: Terminal, desc: 'Akses command premium', Panel: CommandsTab },
  { id: 'cosmetics', label: 'Cosmetics', icon: Palette, desc: 'Custom prefix & tampilan', Panel: CosmeticsTab },
];

const TAB_IDS = TABS.map((t) => t.id);

/**
 * Store — Soft UI.
 *
 * All purchase logic lives inside the tab components and is untouched.
 *
 * Two fixes beyond the reskin:
 *  - The old version built a TAB_CONTENT map holding all six <Tab /> elements,
 *    so every tab's element tree was constructed on every render even though
 *    only one is shown. Now only the active panel is created.
 *  - Tabs are real ARIA tabs (role/aria-selected/aria-controls) with arrow-key
 *    navigation, instead of unlabelled buttons.
 */
export default function StorePage() {
  const [activeTab, setActiveTab] = useState('ranks');
  const current = TABS.find((t) => t.id === activeTab);
  const touchStartX = useRef(null);
  const ActivePanel = current?.Panel;

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    const idx = TAB_IDS.indexOf(activeTab);
    if (dx < 0 && idx < TAB_IDS.length - 1) setActiveTab(TAB_IDS[idx + 1]);
    if (dx > 0 && idx > 0) setActiveTab(TAB_IDS[idx - 1]);
  }

  function handleKeyDown(e) {
    const idx = TAB_IDS.indexOf(activeTab);
    if (e.key === 'ArrowRight' && idx < TAB_IDS.length - 1) {
      e.preventDefault();
      setActiveTab(TAB_IDS[idx + 1]);
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      setActiveTab(TAB_IDS[idx - 1]);
    }
  }

  return (
    <PageLayout>
      <PageHeader
        eyebrow="AeroBlast Store"
        title="Toko In-Game Resmi"
        description="Bayar lewat QRIS — item masuk otomatis begitu pembayaran terdeteksi."
      />

      {/*
        Tab bar — deliberately NOT sticky. Following the scroll made it sit on
        top of the content the user was trying to read. It also let go of the
        backdrop-blur, which forces a repaint of everything behind it on every
        scroll frame.
      */}
      <div className="py-3">
        <div
          role="tablist"
          aria-label="Kategori store"
          onKeyDown={handleKeyDown}
          className={cn(
            // Padding di DALAM scroll container, bukan margin di pill-nya:
            // shadow neumorphic menjorok keluar elemen, dan overflow-x-auto
            // memotongnya tepat di tepi — itu yang tadinya terlihat seperti
            // pill "nabrak"/ngebug dengan pill sebelahnya saat di-scroll.
            'no-scrollbar neu-wrap flex gap-3 overflow-x-auto px-4 py-4 md:justify-center'
          )}
        >
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex min-h-[48px] shrink-0 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-bold',
                  'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease,color_150ms_ease,background-color_150ms_ease]',
                  'active:scale-[0.96]',
                  // Aktif = pressed-in + tinted, jelas beda dari tetangganya
                  // tanpa mengandalkan shadow yang bisa saling tumpang.
                  isActive
                    ? 'bg-[#eef3e2] text-[#1d2b1f] shadow-[var(--neu-in)]'
                    : 'bg-[#fff8f0] text-[#4a5e3a] shadow-[var(--neu-out)] hover:text-[#1d2b1f]'
                )}
              >
                <TabIcon size={16} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="neu-wrap py-8"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <PlayerLoginPrompt />

        {current && (
          <div className="mb-7 flex items-center gap-3">
            <span className="neu-icon h-12 w-12 rounded-[15px]">
              <current.icon size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#1d2b1f]">{current.label}</h2>
              <p className="text-xs text-[#4a5e3a]">{current.desc}</p>
            </div>
          </div>
        )}

        {/* Only the active panel is constructed */}
        <div
          key={activeTab}
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="neu-rise"
        >
          {ActivePanel && <ActivePanel />}
        </div>
      </div>
    </PageLayout>
  );
}

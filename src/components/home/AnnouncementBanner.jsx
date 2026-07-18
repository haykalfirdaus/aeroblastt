import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Megaphone, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const LS_KEY = 'aeroblast_ann_collapsed';

function formatTimeRemaining(expiresAt) {
  const now = Date.now();
  const msLeft = new Date(expiresAt).getTime() - now;
  if (msLeft <= 0) return null;

  const totalMins = Math.floor(msLeft / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0 && mins > 0) return `${hours} jam ${mins} mnt`;
  if (hours > 0) return `${hours} jam`;
  if (mins > 0) return `${mins} mnt`;
  return 'Segera berakhir';
}

export function AnnouncementBanner() {
  const [active, setActive] = useState([]);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/admin/announcements');
        if (!res.ok) return;
        const data = await res.json();
        const now = Date.now();
        const valid = (Array.isArray(data) ? data : data.announcements ?? []).filter(
          (a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now,
        );
        if (!cancelled) setActive(valid.slice(0, 3));
      } catch { /* fail silently */ }
    }
    fetchAnnouncements();
    return () => { cancelled = true; };
  }, []);

  function toggleCollapse() {
    setCollapsed((v) => {
      const next = !v;
      try { next ? localStorage.setItem(LS_KEY, '1') : localStorage.removeItem(LS_KEY); } catch {}
      return next;
    });
  }

  if (!active.length) return null;

  return (
    <div role="region" aria-label="Pengumuman server" className="relative border-y border-[#B4E035]/35 bg-[#B4E035]/[0.07]">
      {/* Header bar — always visible */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#B4E035]/40 bg-[#B4E035]/15">
            <Megaphone size={14} className="text-[#748F1C]" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#748F1C]">
            Pengumuman · {active.length} aktif
          </span>
        </div>
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Tampilkan pengumuman' : 'Sembunyikan pengumuman'}
          className="flex items-center gap-1 rounded-lg border border-[#D8D1C0] bg-[#FAFAF7] px-2.5 py-1 text-xs text-[#6B7F5A] transition-colors hover:border-[#B4E035]/40 hover:text-[#748F1C]"
        >
          {collapsed ? <><ChevronDown size={12} /> Tampilkan</> : <><ChevronUp size={12} /> Kecilkan</>}
        </button>
      </div>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="divide-y divide-[#B4E035]/15 border-t border-[#B4E035]/20">
          {active.map((ann, i) => (
            <AnnouncementRow key={ann.id ?? i} ann={ann} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementRow({ ann }) {
  const timeLabel = ann.expiresAt ? formatTimeRemaining(ann.expiresAt) : null;

  return (
    <div className="flex items-start gap-4 px-4 py-5 sm:px-6 lg:px-8">
      {/* Accent bar */}
      <div className="mt-0.5 w-1 shrink-0 self-stretch rounded-full bg-[#B4E035]/60" aria-hidden="true" />

      <p className="flex-1 text-center text-base font-semibold leading-relaxed text-[#1A2E1A] sm:text-lg">
        {ann.message ?? ann.content ?? ann.text ?? ''}
      </p>

      {timeLabel && (
        <span className="shrink-0 self-start rounded-full border border-[#B4E035]/40 bg-[#B4E035]/15 px-3 py-1 font-mono text-xs font-semibold text-[#748F1C]">
          ⏱ {timeLabel}
        </span>
      )}
    </div>
  );
}

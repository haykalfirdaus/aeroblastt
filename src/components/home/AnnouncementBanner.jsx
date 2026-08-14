import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Megaphone, X } from 'lucide-react';
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
    <div role="region" aria-label="Pengumuman server" className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-3 shadow-[var(--neu-out)] sm:p-4">
        {/* Header bar — always visible */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="neu-icon h-10 w-10 rounded-[13px]">
              <Megaphone size={15} aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#1d2b1f]">
              Pengumuman · {active.length} aktif
            </span>
          </div>
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Tampilkan pengumuman' : 'Sembunyikan pengumuman'}
            className="neu-press inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-4 text-xs font-bold text-[#4a5e3a] shadow-[var(--neu-out)]"
          >
            {collapsed ? <><ChevronDown size={13} aria-hidden="true" /> Tampilkan</> : <><ChevronUp size={13} aria-hidden="true" /> Kecilkan</>}
          </button>
        </div>

        {/* Collapsible body */}
        {!collapsed && (
          <div className="mt-3 flex flex-col gap-3">
            {active.map((ann, i) => (
              <AnnouncementRow key={ann.id ?? i} ann={ann} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementRow({ ann }) {
  const timeLabel = ann.expiresAt ? formatTimeRemaining(ann.expiresAt) : null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-5 py-5 shadow-[var(--neu-in)]">
      <p className="flex-1 text-center text-base font-semibold leading-relaxed text-[#1d2b1f] sm:text-lg">
        {ann.message ?? ann.content ?? ann.text ?? ''}
      </p>

      {timeLabel && (
        <span className="neu-tag inline-flex items-center gap-1.5">
          <Clock size={12} aria-hidden="true" /> {timeLabel}
        </span>
      )}
    </div>
  );
}

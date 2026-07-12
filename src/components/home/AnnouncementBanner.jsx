import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/cn';

function formatTimeRemaining(expiresAt) {
  const now = Date.now();
  const msLeft = new Date(expiresAt).getTime() - now;
  if (msLeft <= 0) return null;

  const totalMins = Math.floor(msLeft / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0 && mins > 0) return `Berakhir dalam ${hours} jam ${mins} menit`;
  if (hours > 0) return `Berakhir dalam ${hours} jam`;
  if (mins > 0) return `Berakhir dalam ${mins} menit`;
  return 'Segera berakhir';
}

export function AnnouncementBanner() {
  const [active, setActive] = useState([]);

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
      } catch {
        /* fail silently */
      }
    }

    fetchAnnouncements();
    return () => { cancelled = true; };
  }, []);

  if (!active.length) return null;

  return (
    <div
      role="region"
      aria-label="Pengumuman server"
      className="border-y border-neon-500/25 bg-neon-500/[0.06]"
    >
      {active.map((ann, i) => (
        <AnnouncementRow key={ann.id ?? i} ann={ann} first={i === 0} />
      ))}
    </div>
  );
}

function AnnouncementRow({ ann, first }) {
  const timeLabel = ann.expiresAt ? formatTimeRemaining(ann.expiresAt) : null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8',
        'border-l-4 border-neon-500',
        !first && 'border-t border-neon-500/15',
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neon-500/30 bg-neon-500/15"
        aria-hidden="true"
      >
        <Megaphone size={18} className="text-neon-400" />
      </span>

      <p className="flex-1 text-sm font-medium leading-relaxed text-text-bright sm:text-base">
        {ann.message ?? ann.content ?? ann.text ?? ''}
      </p>

      {timeLabel && (
        <span className="shrink-0 rounded-full border border-neon-500/30 bg-neon-500/15 px-3 py-1 font-mono text-xs font-medium text-neon-300">
          {timeLabel}
        </span>
      )}
    </div>
  );
}

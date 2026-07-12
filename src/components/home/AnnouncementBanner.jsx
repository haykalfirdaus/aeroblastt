import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Format remaining time until expiry as "X jam Y menit" */
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
      className="border-y border-white/6"
      style={{ background: 'var(--color-abyss)' }}
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
        'flex items-start gap-3 px-4 py-3 sm:px-6 lg:px-8',
        'border-l-2 border-neon-500',
        !first && 'border-t border-white/6',
      )}
    >
      {/* Icon */}
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neon-500/22 bg-neon-500/10"
        aria-hidden="true"
      >
        <Megaphone size={14} className="text-neon-400" />
      </span>

      {/* Message */}
      <p className="flex-1 text-xs leading-relaxed text-text-bright sm:text-sm">
        {ann.message ?? ann.content ?? ann.text ?? ''}
      </p>

      {/* Expiry pill */}
      {timeLabel && (
        <span className="mt-0.5 shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[0.62rem] text-text-muted">
          {timeLabel}
        </span>
      )}
    </div>
  );
}

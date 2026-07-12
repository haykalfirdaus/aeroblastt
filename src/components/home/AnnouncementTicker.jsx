import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';

/**
 * Horizontal marquee ticker showing all active announcements.
 * Uses the `marquee` keyframe already defined in index.css:
 *   @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
 *
 * The content is doubled so the second copy seamlessly continues where
 * the first leaves off, giving an infinite loop illusion.
 */
export function AnnouncementTicker() {
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

        if (!cancelled) setActive(valid);
      } catch {
        /* fail silently */
      }
    }

    fetchAnnouncements();
    return () => { cancelled = true; };
  }, []);

  if (!active.length) return null;

  /* Double the list so the marquee loops seamlessly */
  const doubled = [...active, ...active];

  /* Speed: roughly 60px per second; clamp between 18s and 40s */
  const approxWidth = active.reduce(
    (sum, a) => sum + ((a.message ?? a.content ?? a.text ?? '').length * 8 + 80),
    0,
  );
  const duration = Math.min(40, Math.max(18, approxWidth / 60));

  return (
    <div
      role="marquee"
      aria-label="Ticker pengumuman server"
      className="overflow-hidden border-y border-white/6 py-2.5"
      style={{ background: 'var(--color-abyss)' }}
    >
      <div
        className="marquee-track flex w-max items-center gap-0"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
      >
        {doubled.map((ann, i) => (
          <TickerItem key={`${ann.id ?? i}-${i}`} ann={ann} />
        ))}
      </div>
    </div>
  );
}

function TickerItem({ ann }) {
  const text = ann.message ?? ann.content ?? ann.text ?? '';

  return (
    <span className="flex shrink-0 items-center gap-2 pr-8">
      {/* Separator icon */}
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-neon-500/30 bg-neon-500/10"
      >
        <Megaphone size={10} className="text-neon-400" />
      </span>

      <span className="text-xs font-medium text-text-bright">{text}</span>
    </span>
  );
}

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';

/**
 * Horizontal marquee ticker showing all active announcements.
 * Uses the `marquee` keyframe already defined in index.css.
 * Content is doubled for seamless infinite loop.
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

  const doubled = [...active, ...active];

  const approxWidth = active.reduce(
    (sum, a) => sum + ((a.message ?? a.content ?? a.text ?? '').length * 9 + 100),
    0,
  );
  const duration = Math.min(40, Math.max(18, approxWidth / 60));

  return (
    <div
      role="marquee"
      aria-label="Ticker pengumuman server"
      className="overflow-hidden border-y border-[#B4E035]/25 bg-[#B4E035]/[0.05] py-3"
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
    <span className="flex shrink-0 items-center gap-2.5 pr-10">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full border border-[#B4E035]/40 bg-[#B4E035]/15"
      >
        <Megaphone size={13} className="text-[#748F1C]" />
      </span>
      <span className="text-sm font-medium text-[#1A2E1A]">{text}</span>
    </span>
  );
}

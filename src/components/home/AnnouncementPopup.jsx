import { useEffect, useState } from 'react';
import { Clock, Megaphone, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const LS_KEY = 'aeroblast_popup_seen';

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

export function AnnouncementPopup() {
  const [ann, setAnn] = useState(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Only show once per session
    try {
      if (sessionStorage.getItem(LS_KEY)) return;
    } catch {}

    async function fetchAndShow() {
      try {
        const res = await fetch('/api/admin/announcements');
        if (!res.ok) return;
        const data = await res.json();
        const now = Date.now();
        const valid = (Array.isArray(data) ? data : data.announcements ?? []).filter(
          (a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now,
        );
        if (!valid.length) return;

        // Pick the one expiring soonest (or first if none have expiry)
        const withExpiry = valid.filter((a) => a.expiresAt);
        const pick = withExpiry.length
          ? withExpiry.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt))[0]
          : valid[0];

        setAnn(pick);
        // Small delay so page loads first
        setTimeout(() => setVisible(true), 600);
      } catch { /* silent */ }
    }

    fetchAndShow();
  }, []);

  function dismiss() {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      try { sessionStorage.setItem(LS_KEY, '1'); } catch {}
    }, 250);
  }

  if (!visible || !ann) return null;

  const timeLabel = ann.expiresAt ? formatTimeRemaining(ann.expiresAt) : null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'bg-[#1d2b1f]/40 ',
        'transition-opacity duration-250',
        closing ? 'opacity-0' : 'opacity-100',
      )}
      onClick={dismiss}
    >
      <div
        className={cn(
          'relative w-full max-w-lg rounded-[var(--radius-neu-xl)] p-5',
          'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out-lg)]',
          'transition-transform duration-250',
          closing ? 'scale-95' : 'scale-100',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="neu-icon h-10 w-10 rounded-[13px]">
              <Megaphone size={16} aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-widest text-[#1d2b1f]">Pengumuman</span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Tutup pengumuman"
            className="neu-press grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] text-[#4a5e3a] shadow-[var(--neu-out)]"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-6 py-7 text-center shadow-[var(--neu-in)]">
          <p className="text-lg font-semibold leading-relaxed text-[#1d2b1f] sm:text-xl">
            {ann.message ?? ann.content ?? ann.text ?? ''}
          </p>

          {timeLabel && (
            <div className="neu-tag mt-4 inline-flex items-center gap-1.5">
              <Clock size={13} aria-hidden="true" /> {timeLabel}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5">
          <button
            type="button"
            onClick={dismiss}
            className="neu-press neu-lime min-h-[48px] w-full rounded-full text-sm font-bold"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

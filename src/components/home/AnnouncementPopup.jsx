import { useEffect, useState } from 'react';
import { Megaphone, X } from 'lucide-react';
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
          'relative w-full max-w-lg overflow-hidden rounded-md',
          'border border-[#BFFF5E]/30 bg-[#fff8f0] shadow-[0_32px_64px_-16px_rgba(26,46,26,0.25)]',
          'transition-transform duration-250',
          closing ? 'scale-95' : 'scale-100',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow top */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #BFFF5E, transparent)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-2 border-[#1d2b1f] bg-[#BFFF5E]/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#BFFF5E]/40 bg-[#BFFF5E]/15">
              <Megaphone size={15} className="text-[#1d2b1f]" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-widest text-[#1d2b1f]">Pengumuman</span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Tutup pengumuman"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-2 border-[#1d2b1f] bg-[#fffdf9] text-[#4a5e3a] transition-colors hover:border-[#BFFF5E]/40 hover:text-[#1d2b1f]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-7 text-center">
          <p className="text-lg font-semibold leading-relaxed text-[#1d2b1f] sm:text-xl">
            {ann.message ?? ann.content ?? ann.text ?? ''}
          </p>

          {timeLabel && (
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-[#BFFF5E]/35 bg-[#BFFF5E]/10 px-4 py-1.5 font-mono text-sm font-medium text-[#1d2b1f]">
              ⏱ {timeLabel}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-2 border-[#1d2b1f] px-6 py-3.5">
          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-md bg-[#BFFF5E] py-2.5 text-sm font-semibold text-[#1d2b1f] transition-colors hover:bg-[#9CC81E]"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

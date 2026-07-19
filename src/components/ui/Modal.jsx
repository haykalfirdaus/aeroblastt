'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { cn } from '@/lib/cn';

export function Modal({ open, onClose, title, subtitle, icon, badge, size = 'md', children }) {
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal hanya tersedia di browser
  useEffect(() => setMounted(true), []);

  useLockBodyScroll(open);
  useEscapeKey(rendered, onClose);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    const timeout = setTimeout(() => setRendered(false), 150);
    return () => clearTimeout(timeout);
  }, [open]);

  if (!mounted || !rendered) return null;

  const sizeClass = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return createPortal(
    // Overlay: portal ke document.body — dijamin di atas navbar/footer/apapun
    <div
      className={cn(
        'fixed inset-0 z-[9999] bg-[#1d2b1f]/70 transition-opacity duration-150',
        entered ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            'relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-md border-2 border-[#1d2b1f] bg-[#fff8f0] shadow-[4px_4px_0_#1d2b1f] transition-all duration-150',
            sizeClass,
            entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none sticky top-0 z-10 block h-0.5 w-full bg-[#BFFF5E]"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-md border-2 border-[#1d2b1f] bg-[#f5ece0] text-[#4a5e3a] transition hover:bg-[#BFFF5E] hover:text-[#1d2b1f]"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {(title || icon) && (
            <div className="flex flex-col items-center gap-1.5 px-6 pb-2 pt-7 text-center sm:px-8">
              {badge && (
                <span className="mb-1 inline-flex items-center gap-1.5 rounded border border-[#1d2b1f]/40 bg-[#BFFF5E]/30 px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-[#1d2b1f]">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#1d2b1f]" />
                  {badge}
                </span>
              )}
              {title && (
                <h3 id="modal-title" className="font-display text-lg font-bold text-[#1d2b1f] sm:text-xl">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-xs text-[#4a5e3a]">{subtitle}</p>}
            </div>
          )}

          <div className="px-6 pb-6 sm:px-8 sm:pb-8">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

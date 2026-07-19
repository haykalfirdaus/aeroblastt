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
        'fixed inset-0 z-[9999] bg-[#1A2E1A]/60 backdrop-blur-sm transition-opacity duration-150',
        entered ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Centering + klik backdrop: stopPropagation agar klik card tidak tutup modal */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card: satu-satunya yang punya scrollbar */}
        <div
          className={cn(
            'relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-[#D8D1C0] bg-[#FAF8F4] shadow-[0_20px_60px_-12px_rgba(26,46,26,0.25)] transition-all duration-150',
            sizeClass,
            entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none sticky top-0 z-10 block h-px w-full bg-gradient-to-r from-transparent via-[#B4E035]/50 to-transparent"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] transition hover:border-[#1A2E1A]/30 hover:bg-[#EDE8DA] hover:text-[#1A2E1A]"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {(title || icon) && (
            <div className="flex flex-col items-center gap-1.5 px-6 pb-2 pt-7 text-center sm:px-8">
              {badge && (
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[#B4E035]/40 bg-[#B4E035]/10 px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-[#748F1C]">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#B4E035]" />
                  {badge}
                </span>
              )}
              {title && (
                <h3 id="modal-title" className="font-display text-lg font-bold text-[#1A2E1A] sm:text-xl">
                  {title}
                </h3>
              )}
              {subtitle && <p className="text-xs text-[#4A5E3E]">{subtitle}</p>}
            </div>
          )}

          <div className="px-6 pb-6 sm:px-8 sm:pb-8">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

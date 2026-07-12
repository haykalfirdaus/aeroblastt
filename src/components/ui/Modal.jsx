import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { cn } from '@/lib/cn';

/**
 * Optimized modal: removed backdrop-blur-2xl (very heavy), replaced with solid overlay.
 * Animations use only transform & opacity (no blur animations).
 */
export function Modal({ open, onClose, title, subtitle, icon, badge, size = 'md', children }) {
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);

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

  if (!rendered) return null;

  const sizeClass = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return (
    <div
      className={cn(
        'fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto p-4 py-10 transition-opacity duration-150',
        entered ? 'opacity-100' : 'opacity-0'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="fixed inset-0 bg-abyss/75" onClick={onClose} aria-hidden="true" />

      <div
        className={cn(
          'relative w-full rounded-2xl border border-white/10 bg-panel/90 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)] transition-all duration-150',
          sizeClass,
          entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-neon-400/40 to-transparent"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/4 text-text-muted transition hover:border-white/20 hover:bg-white/8 hover:text-text-bright"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {(title || icon) && (
          <div className="flex flex-col items-center gap-1.5 px-6 pb-2 pt-7 text-center sm:px-8">
            {badge && (
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-neon-500/25 bg-neon-500/8 px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neon-400" />
                {badge}
              </span>
            )}
            {title && (
              <h3 id="modal-title" className="font-display text-lg font-bold text-text-bright sm:text-xl">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
          </div>
        )}

        <div className="max-h-[75vh] overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">{children}</div>
      </div>
    </div>
  );
}

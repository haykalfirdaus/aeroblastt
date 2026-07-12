import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useEscapeKey } from '@/hooks/useEscapeKey';

/**
 * Fully custom dropdown replacing native <select>.
 *
 * Props:
 *   value        — currently selected value
 *   onChange     — called with newValue when an option is selected
 *   options      — [{ value, label, description? }]
 *   placeholder  — text shown when no value is selected
 *   className    — extra classes on the root wrapper
 *   label        — optional visible label rendered above the trigger
 *   disabled     — disables the entire control
 */
export function CustomSelect({ value, onChange, options = [], placeholder = 'Select…', className, label, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value) ?? null;

  // ── close helpers ────────────────────────────────────────────────────────────
  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  useEscapeKey(open, close);

  // Click-outside
  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, close]);

  // Scroll focused option into view
  useEffect(() => {
    if (!open || focusedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[focusedIndex];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [open, focusedIndex]);

  // When opening, pre-focus on the currently selected option
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [open]); // intentionally omit options/value — only on open toggle

  // ── keyboard ─────────────────────────────────────────────────────────────────
  function handleTriggerKeyDown(e) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        if (e.key === 'ArrowDown') setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        if (e.key === 'ArrowUp') setFocusedIndex((i) => Math.max(i - 1, 0));
      }
    }
  }

  function handleListKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex >= 0 && options[focusedIndex]) {
        selectOption(options[focusedIndex].value);
      }
    }
  }

  function selectOption(val) {
    onChange?.(val);
    close();
  }

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </span>
      )}

      {/* Trigger */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3',
          'text-sm outline-none transition-colors',
          'hover:border-white/25 hover:bg-white/[0.06]',
          open && 'border-neon-400/60 bg-white/[0.06] ring-2 ring-neon-500/20',
          !open && 'focus-visible:border-neon-400/60 focus-visible:ring-2 focus-visible:ring-neon-500/20',
          disabled && 'cursor-not-allowed opacity-40',
          !disabled && 'cursor-pointer'
        )}
      >
        <span className={cn('truncate', selectedOption ? 'text-text-bright' : 'text-text-faint')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={cn(
            'shrink-0 text-text-dim transition-transform duration-150',
            open && 'rotate-180 text-neon-400'
          )}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          'absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]',
          'transition-all duration-150 origin-top',
          open ? 'opacity-100 translate-y-0 scale-y-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-y-95 pointer-events-none'
        )}
        style={{ transformOrigin: 'top' }}
      >
        {/* Neon top-edge accent */}
        <span
          aria-hidden="true"
          className="block h-px w-full bg-gradient-to-r from-transparent via-neon-400/30 to-transparent"
        />

        <ul
          ref={listRef}
          role="listbox"
          aria-label={label ?? placeholder}
          onKeyDown={handleListKeyDown}
          tabIndex={-1}
          className="max-h-60 overflow-y-auto py-1 focus:outline-none"
        >
          {options.map((option, idx) => {
            const isSelected = option.value === value;
            const isFocused = idx === focusedIndex;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onPointerDown={(e) => {
                  // Use pointerdown so it fires before the click-outside listener
                  e.preventDefault();
                  selectOption(option.value);
                }}
                onPointerEnter={() => setFocusedIndex(idx)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  isFocused && !isSelected && 'bg-white/[0.06] text-text-bright',
                  isSelected && 'bg-neon-500/10 text-neon-300',
                  !isFocused && !isSelected && 'text-text-muted'
                )}
              >
                {/* Check column — always reserve the space so labels align */}
                <span className="flex w-4 shrink-0 items-center justify-center">
                  {isSelected && <Check size={13} strokeWidth={3} className="text-neon-400" />}
                </span>

                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate font-medium leading-snug">{option.label}</span>
                  {option.description && (
                    <span className="truncate text-[0.7rem] text-text-dim leading-snug">
                      {option.description}
                    </span>
                  )}
                </span>
              </li>
            );
          })}

          {options.length === 0 && (
            <li className="px-4 py-3 text-center text-xs text-text-dim">No options available</li>
          )}
        </ul>
      </div>
    </div>
  );
}

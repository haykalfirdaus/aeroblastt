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
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4a5e3a]">
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
          'flex w-full items-center justify-between gap-2 rounded-md border border-[#1d2b1f]/30 bg-[#fffdf9] px-4 py-3',
          'text-sm outline-none transition-colors',
          'hover:border-[#1d2b1f]/60 hover:bg-[#faf3e8]',
          open && 'border-[#1d2b1f] bg-[#faf3e8] ring-2 ring-[#BFFF5E]/30',
          !open && 'focus-visible:border-[#1d2b1f] focus-visible:ring-2 focus-visible:ring-[#BFFF5E]/30',
          disabled && 'cursor-not-allowed opacity-40',
          !disabled && 'cursor-pointer'
        )}
      >
        <span className={cn('truncate', selectedOption ? 'text-[#1d2b1f]' : 'text-[#8a9e7a]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={cn(
            'shrink-0 text-[#4a5e3a] transition-transform duration-150',
            open && 'rotate-180 text-[#1d2b1f]'
          )}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          'absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-md border border-[#1d2b1f]/30 bg-[#fffdf9] shadow-[2px_4px_16px_-4px_rgba(29,43,31,0.12)]',
          'transition-all duration-150 origin-top',
          open ? 'opacity-100 translate-y-0 scale-y-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-y-95 pointer-events-none'
        )}
        style={{ transformOrigin: 'top' }}
      >
        {/* Neon top-edge accent */}
        <span
          aria-hidden="true"
          className="block h-px w-full bg-gradient-to-r from-transparent via-[#BFFF5E]/40 to-transparent"
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
                  isFocused && !isSelected && 'bg-[#f5ede0] text-[#1d2b1f]',
                  isSelected && 'bg-[#BFFF5E]/15 text-[#1d2b1f]',
                  !isFocused && !isSelected && 'text-[#4a5e3a]'
                )}
              >
                {/* Check column — always reserve the space so labels align */}
                <span className="flex w-4 shrink-0 items-center justify-center">
                  {isSelected && <Check size={13} strokeWidth={3} className="text-[#1d2b1f]" />}
                </span>

                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate font-medium leading-snug">{option.label}</span>
                  {option.description && (
                    <span className="truncate text-[0.7rem] text-[#6b7f5a] leading-snug">
                      {option.description}
                    </span>
                  )}
                </span>
              </li>
            );
          })}

          {options.length === 0 && (
            <li className="px-4 py-3 text-center text-xs text-[#6b7f5a]">No options available</li>
          )}
        </ul>
      </div>
    </div>
  );
}

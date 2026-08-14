import { forwardRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Shared form primitives — Soft UI.
 *
 * Every modal and order form in the app funnels through these, so converting
 * this file reskins the whole checkout flow at once.
 *
 * In neumorphism an input is CARVED INTO the surface (inset shadow) while a
 * button is raised out of it. That contrast is what tells users which elements
 * accept typing and which accept clicks — it replaces the borders entirely.
 *
 * Props and refs are unchanged, so no call site needs editing.
 */

const fieldBase =
  'neu-field text-sm placeholder:text-[#5a7048] focus-visible:outline-none';

export function FieldLabel({ children, required }) {
  return (
    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4a5e3a]">
      {children}
      {required && (
        <span className="ml-0.5 text-[#3d7208]" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  );
}

export const TextField = forwardRef(function TextField({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={error ? 'true' : undefined}
      className={cn(fieldBase, error && 'shadow-[inset_0_0_0_2px_#ef4444]', className)}
      {...props}
    />
  );
});

export const SelectField = forwardRef(function SelectField({ className, children, ...props }, ref) {
  return (
    <div className="group relative">
      <select
        ref={ref}
        style={{ colorScheme: 'light' }}
        className={cn(fieldBase, 'cursor-pointer appearance-none pr-11 text-[#1d2b1f]', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4a5e3a]"
      />
    </div>
  );
});

export const TextareaField = forwardRef(function TextareaField({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-[110px] resize-y', className)} {...props} />;
});

export function CheckboxField({ checked, onChange, children, className }) {
  return (
    <label className={cn('flex cursor-pointer select-none items-start gap-3', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      {/*
        Unchecked reads as an empty debossed well; checked fills with lime and
        pops out. The state change is legible without relying on colour alone,
        since the depth flips too.
      */}
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg [transition:box-shadow_150ms_ease,background_150ms_ease]',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#3d7208]',
          checked
            ? 'bg-[linear-gradient(145deg,#d4ff80,#a8f040)] shadow-[var(--neu-out)]'
            : 'bg-[#fff8f0] shadow-[var(--neu-in)]'
        )}
      >
        {checked && <Check size={14} strokeWidth={3} className="text-[#22331a]" />}
      </span>
      <span className="text-sm leading-snug text-[#4a5e3a]">{children}</span>
    </label>
  );
}

import { forwardRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60 focus:bg-white/[0.06]';

export function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
      {required && <span className="text-neon-400"> *</span>}
    </label>
  );
}

export const TextField = forwardRef(function TextField({ className, error, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, error && 'border-danger/60', className)} {...props} />;
});

export const SelectField = forwardRef(function SelectField({ className, children, ...props }, ref) {
  return (
    <div className="group relative">
      <select
        ref={ref}
        style={{ colorScheme: 'dark' }}
        className={cn(
          fieldBase,
          'appearance-none pr-10 cursor-pointer text-text-muted transition-colors hover:border-white/30 hover:text-white focus:text-white',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-dim transition-colors group-hover:text-white" />
    </div>
  );
});

export const TextareaField = forwardRef(function TextareaField({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-[100px] resize-y', className)} {...props} />;
});

/** Custom-styled checkbox, used for the "I agree to the Terms" gate on every order form. */
export function CheckboxField({ checked, onChange, children, className }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 select-none', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
          checked ? 'border-neon-400 bg-neon-500' : 'border-white/25 bg-white/5'
        )}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      </span>
      <span className="text-sm leading-snug text-text-muted">{children}</span>
    </label>
  );
}

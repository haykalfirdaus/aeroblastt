import { forwardRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-md border border-[#1d2b1f]/40 bg-[#fffdf9] px-4 py-3 text-sm text-[#1d2b1f] placeholder:text-[#8a9e7a] outline-none transition-all focus:border-[#1d2b1f] focus:bg-white focus:ring-2 focus:ring-[#BFFF5E]/40';

export function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4a5e3a]">
      {children}
      {required && <span className="text-[#BFFF5E] ml-0.5"> *</span>}
    </label>
  );
}

export const TextField = forwardRef(function TextField({ className, error, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, error && 'border-danger/80 focus:ring-danger/30', className)} {...props} />;
});

export const SelectField = forwardRef(function SelectField({ className, children, ...props }, ref) {
  return (
    <div className="group relative">
      <select
        ref={ref}
        style={{ colorScheme: 'light' }}
        className={cn(
          fieldBase,
          'appearance-none pr-10 cursor-pointer text-[#4a5e3a] transition-colors hover:text-[#1d2b1f] focus:text-[#1d2b1f]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4a5e3a] transition-colors group-hover:text-[#1d2b1f]" />
    </div>
  );
});

export const TextareaField = forwardRef(function TextareaField({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-[100px] resize-y', className)} {...props} />;
});

export function CheckboxField({ checked, onChange, children, className }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 select-none', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-[#1d2b1f]/50 transition-colors',
          checked ? 'border-[#1d2b1f] bg-[#BFFF5E]' : 'bg-[#fffdf9]'
        )}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-[#1d2b1f]" />}
      </span>
      <span className="text-sm leading-snug text-[#4a5e3a]">{children}</span>
    </label>
  );
}

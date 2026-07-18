import { forwardRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-xl border border-[#D8D1C0] bg-[#FAFAF7] px-4 py-3 text-sm text-[#1A2E1A] placeholder:text-[#8A9E7A] outline-none transition-colors focus:border-[#B4E035]/70 focus:bg-white focus:ring-2 focus:ring-[#B4E035]/20';

export function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4A5E3E]">
      {children}
      {required && <span className="text-[#B4E035]"> *</span>}
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
        style={{ colorScheme: 'light' }}
        className={cn(
          fieldBase,
          'appearance-none pr-10 cursor-pointer text-[#4A5E3E] transition-colors hover:border-[#1A2E1A]/30 hover:text-[#1A2E1A] focus:text-[#1A2E1A]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7F5A] transition-colors group-hover:text-[#1A2E1A]" />
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
          checked ? 'border-[#B4E035] bg-[#B4E035]' : 'border-[#D8D1C0] bg-[#F0EBE0]'
        )}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-[#1A2E1A]" />}
      </span>
      <span className="text-sm leading-snug text-[#4A5E3E]">{children}</span>
    </label>
  );
}

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary:
    'bg-[#B4E035] text-[#1A2E1A] ' +
    'shadow-[0_2px_8px_rgba(180,224,53,0.35)] ' +
    'hover:bg-[#C8EF5A] hover:shadow-[0_4px_16px_rgba(180,224,53,0.5)] ' +
    'active:bg-[#9FC82B]',
  secondary:
    'border border-[#1A2E1A]/20 bg-transparent text-[#1A2E1A] ' +
    'hover:border-[#1A2E1A]/40 hover:bg-[#1A2E1A]/5',
  ghost: 'text-[#6B7F5A] hover:text-[#1A2E1A] hover:bg-[#1A2E1A]/5',
  danger: 'border border-danger/25 bg-danger/8 text-danger-bright hover:bg-danger/12 hover:border-danger/40',
};

const SIZES = {
  sm: 'px-4 py-2 text-xs gap-1.5 rounded-full',
  md: 'px-6 py-2.5 text-sm gap-2 rounded-full',
  lg: 'px-8 py-3 text-sm sm:text-base gap-2.5 rounded-full',
};

export const Button = forwardRef(function Button(
  { as = 'button', variant = 'primary', size = 'md', className, fullWidth = false, children, ...props },
  ref
) {
  const Component = as;
  return (
    <Component
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-black tracking-tight transition-all duration-150 hw-transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

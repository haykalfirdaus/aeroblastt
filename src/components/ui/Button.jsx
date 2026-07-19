import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary:
    'bg-[#BFFF5E] text-[#1d2b1f] border-2 border-[#1d2b1f] ' +
    'shadow-[4px_4px_0_#1d2b1f] ' +
    'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#1d2b1f] ' +
    'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
  secondary:
    'border-2 border-[#1d2b1f] bg-transparent text-[#1d2b1f] ' +
    'shadow-[2px_2px_0_#1d2b1f] ' +
    'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ' +
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  ghost: 'text-[#4a5e3a] hover:text-[#1d2b1f] hover:bg-[#1d2b1f]/5 border border-transparent hover:border-[#1d2b1f]/20',
  danger: 'border border-danger/50 bg-danger/8 text-danger-bright hover:bg-danger/15',
};

const SIZES = {
  sm: 'px-4 py-2 text-xs gap-1.5 rounded-md',
  md: 'px-6 py-2.5 text-sm gap-2 rounded-md',
  lg: 'px-8 py-3 text-sm sm:text-base gap-2.5 rounded-md',
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
        'inline-flex items-center justify-center font-black tracking-tight transition-all duration-150 hw-transition disabled:cursor-not-allowed disabled:opacity-50',
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

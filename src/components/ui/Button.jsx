import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-neon-600 to-neon-500 text-white ' +
    'shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_4px_16px_-4px_rgba(59,130,246,0.5)] ' +
    'hover:shadow-[0_0_0_1px_rgba(96,165,250,0.5),0_8px_24px_-6px_rgba(59,130,246,0.65)] ' +
    'hover:from-neon-500 hover:to-neon-400',
  secondary:
    'border border-white/18 bg-white/[0.05] text-text-bright ' +
    'hover:border-neon-400/50 hover:bg-neon-500/8 hover:text-neon-300',
  ghost: 'text-text-muted hover:text-text-bright hover:bg-white/5',
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

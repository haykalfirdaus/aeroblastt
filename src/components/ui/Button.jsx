import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Soft UI button.
 *
 * The public API (as / variant / size / fullWidth / className) is UNCHANGED
 * from the blocky version, so every existing call site keeps working — only
 * the surface treatment moved from hard-offset borders to convex/concave
 * neumorphic shadows.
 *
 * PERF: hover/active tween `transform` only (compositor-only property). The
 * shadow swap is discrete rather than tweened — transitioning box-shadow
 * repaints every frame and is a primary jank source in the current build.
 */
const VARIANTS = {
  primary: 'neu-lime',
  secondary: 'bg-[#fff8f0] text-[#1d2b1f] shadow-[var(--neu-out)]',
  ghost: 'bg-transparent text-[#4a5e3a] shadow-none hover:text-[#1d2b1f] hover:shadow-[var(--neu-out)]',
  danger: 'bg-[#fff8f0] text-[#dc2626] shadow-[var(--neu-out)]',
};

/* Every size clears the 48px minimum touch target. */
const SIZES = {
  sm: 'min-h-[48px] px-5 py-2.5 text-[0.85rem] gap-1.5',
  md: 'min-h-[48px] px-6 py-3 text-sm gap-2',
  lg: 'min-h-[52px] px-8 py-3.5 text-sm sm:text-base gap-2.5',
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
        'inline-flex select-none items-center justify-center rounded-full font-extrabold tracking-tight',
        'cursor-pointer will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
        'hover:-translate-y-[3px] active:scale-[0.97] active:shadow-[var(--neu-in)]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
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

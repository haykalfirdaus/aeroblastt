import { cn } from '@/lib/cn';

/**
 * Soft UI badge — debossed (concave) pill.
 *
 * In neumorphism a badge is informational, not interactive, so it reads as
 * carved INTO the surface (inset shadow) rather than raised out of it. That
 * keeps the raised treatment meaningful: raised = pressable.
 *
 * Tone keys are unchanged (neon / cyan / gold / danger / success / dim).
 */
const TONES = {
  neon: 'text-[#3d7208]',
  cyan: 'text-[#0891b2]',
  gold: 'text-[#b45309]',
  danger: 'text-[#dc2626]',
  success: 'text-[#046b4d]',
  dim: 'text-[#4a5e3a]',
};

export function Badge({ tone = 'neon', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-[#fff8f0] px-3 py-1',
        'shadow-[var(--neu-in)] font-mono text-[0.65rem] font-bold uppercase tracking-wider',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

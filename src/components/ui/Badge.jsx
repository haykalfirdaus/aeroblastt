import { cn } from '@/lib/cn';

const TONES = {
  neon: 'border-[#1d2b1f] bg-[#BFFF5E] text-[#1d2b1f]',
  cyan: 'border-[#1d2b1f]/40 bg-[#4a5e3a]/10 text-[#354530]',
  gold: 'border-warning/50 bg-warning/15 text-[#b45309]',
  danger: 'border-danger/40 bg-danger/10 text-danger-bright',
  success: 'border-success/40 bg-success/10 text-success-bright',
  dim: 'border-[#1d2b1f]/25 bg-[#f5ece0] text-[#4a5e3a]',
};

export function Badge({ tone = 'neon', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-wider',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

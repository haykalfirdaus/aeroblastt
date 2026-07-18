import { cn } from '@/lib/cn';

const TONES = {
  neon: 'border-[#B4E035]/40 bg-[#B4E035]/10 text-[#748F1C]',
  cyan: 'border-[#6B7F5A]/35 bg-[#6B7F5A]/10 text-[#566947]',
  gold: 'border-warning/30 bg-warning/10 text-[#b45309]',
  danger: 'border-danger/30 bg-danger/10 text-danger-bright',
  success: 'border-success/30 bg-success/10 text-success-bright',
  dim: 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A]',
};

export function Badge({ tone = 'neon', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-wider',
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

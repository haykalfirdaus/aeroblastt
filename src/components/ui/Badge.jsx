import { cn } from '@/lib/cn';

const TONES = {
  neon: 'border-neon-500/30 bg-neon-500/10 text-neon-300',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  gold: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger-bright',
  success: 'border-success/30 bg-success/10 text-success-bright',
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

import { cn } from '@/lib/cn';

export function SectionHeading({ eyebrow, title, description, align = 'center', className }) {
  return (
    <div className={cn('mb-12 flex max-w-2xl flex-col gap-4', align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left', className)}>
      {eyebrow && (
        <span className="badge-pill border border-neon-500/25 bg-neon-500/8 text-neon-300">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-impact leading-[1.05] tracking-tight" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
        <span className="text-shimmer">{title}</span>
      </h2>
      {description && <p className="text-balance text-sm leading-relaxed text-text-muted">{description}</p>}
    </div>
  );
}

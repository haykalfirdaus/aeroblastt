import { cn } from '@/lib/cn';

export function SectionHeading({ eyebrow, title, description, align = 'center', className, ...rest }) {
  return (
    <div className={cn('mb-12 flex max-w-2xl flex-col gap-4', align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left', className)} {...rest}>
      {eyebrow && (
        <span className="badge-pill border border-[#B4E035]/50 bg-[#B4E035]/10 text-[#748F1C]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B4E035]" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display font-extrabold leading-[1.05] tracking-tight text-[#1A2E1A]" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
        <span className="text-shimmer">{title}</span>
      </h2>
      {description && <p className="text-balance text-sm leading-relaxed text-[#4A5E3E]">{description}</p>}
    </div>
  );
}

import { cn } from '@/lib/cn';

/**
 * Soft UI section heading.
 *
 * Props unchanged (eyebrow / title / description / align / className), and it
 * still spreads `...rest` so existing `data-aos="fade-up"` attributes on call
 * sites remain harmless no-ops after AOS is removed.
 *
 * PERF: the old version wrapped the title in `.text-shimmer`, a
 * background-clip:text gradient. That forces the text onto its own paint layer
 * and blurs glyph antialiasing. Flat brand ink renders faster and sharper.
 */
export function SectionHeading({ eyebrow, title, description, align = 'center', className, ...rest }) {
  return (
    <div
      className={cn(
        'mb-12 flex max-w-2xl flex-col gap-4',
        align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left',
        className
      )}
      {...rest}
    >
      {eyebrow && <span className="neu-chip">{eyebrow}</span>}

      <h2
        className="font-display font-extrabold leading-[1.05] tracking-tight text-[#1d2b1f]"
        style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
      >
        {title}
      </h2>

      {description && (
        <p className="text-balance text-sm leading-relaxed text-[#4a5e3a]">{description}</p>
      )}
    </div>
  );
}

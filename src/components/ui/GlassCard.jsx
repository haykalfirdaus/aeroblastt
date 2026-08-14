import { cn } from '@/lib/cn';

/**
 * Soft UI surface — the workhorse card used across every page.
 *
 * Props are UNCHANGED (as / accent / glow / interactive / wallpaper), so no
 * call site needs editing. Behaviour notes for the new treatment:
 *  - `glow`   → now a soft accent bar with rounded ends instead of a hard rule.
 *  - `accent` → still reads `var(--color-${accent})`, so rank/command accent
 *               tokens in the data files keep working exactly as before.
 *
 * PERF: the `wallpaper` overlay is a plain CSS background (no extra network
 * request beyond the shared image, no <img> to lay out) and is marked
 * aria-hidden so it costs nothing on the a11y tree.
 */
export function GlassCard({
  as: Component = 'div',
  accent,
  glow = true,
  interactive = false,
  wallpaper,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'group relative overflow-hidden bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))]',
        'rounded-[var(--radius-neu-lg)] shadow-[var(--neu-out)]',
        interactive &&
          'cursor-pointer will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease] ' +
            'hover:-translate-y-[3px] hover:shadow-[var(--neu-out-lg)] active:scale-[0.98] active:shadow-[var(--neu-in)]',
        className
      )}
      style={accent ? { '--accent': `var(--color-${accent})` } : undefined}
      {...props}
    >
      {wallpaper && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url('/${wallpaper}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.05,
          }}
        />
      )}
      {glow && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-3 h-1 w-11 -translate-x-1/2 rounded-full"
          style={{ background: accent ? 'var(--accent)' : '#BFFF5E', opacity: 0.9 }}
        />
      )}
      {children}
    </Component>
  );
}

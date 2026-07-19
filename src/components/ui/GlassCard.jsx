import { cn } from '@/lib/cn';

export function GlassCard({ as: Component = 'div', accent, glow = true, interactive = false, wallpaper, className, children, ...props }) {
  return (
    <Component
      className={cn(
        'group relative overflow-hidden rounded-md border border-[#1d2b1f]/30 bg-[#fffdf9]',
        'transition-all duration-150 hw-transition',
        interactive && [
          'cursor-default',
          'hover:border-[#1d2b1f]/60 hover:bg-[#faf3e8]',
        ],
        className
      )}
      style={accent ? { '--accent': `var(--color-${accent})` } : undefined}
      {...props}
    >
      {wallpaper && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-md"
          style={{
            backgroundImage: `url('/${wallpaper}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.06,
          }}
        />
      )}
      {glow && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: accent ? `var(--accent)` : '#BFFF5E', opacity: 0.7 }}
        />
      )}
      {children}
    </Component>
  );
}

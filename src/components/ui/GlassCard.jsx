import { cn } from '@/lib/cn';

export function GlassCard({ as: Component = 'div', accent, glow = true, interactive = false, wallpaper, className, children, ...props }) {
  return (
    <Component
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]',
        'backdrop-blur-[10px] transition-all duration-200 hw-transition',
        interactive && [
          'cursor-default',
          'hover:scale-[1.02] hover:-translate-y-0.5',
          'hover:border-white/20 hover:bg-white/[0.055]',
          'hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(96,165,250,0.1)]',
        ],
        className
      )}
      style={accent ? { '--accent': `var(--color-${accent})` } : undefined}
      {...props}
    >
      {wallpaper && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl"
          style={{
            backgroundImage: `url('/${wallpaper}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.07,
          }}
        />
      )}
      {glow && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px opacity-60"
          style={{ background: accent ? `linear-gradient(90deg, transparent, var(--accent), transparent)` : 'linear-gradient(90deg, transparent, var(--color-neon-500), transparent)' }}
        />
      )}
      {children}
    </Component>
  );
}

import { cn } from '@/lib/cn';

export function GlassCard({ as: Component = 'div', accent, glow = true, interactive = false, wallpaper, className, children, ...props }) {
  return (
    <Component
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7]',
        'transition-all duration-200 hw-transition',
        interactive && [
          'cursor-default',
          'hover:scale-[1.02] hover:-translate-y-0.5',
          'hover:border-[#B4E035]/50 hover:bg-[#F5F2EA]',
          'hover:shadow-[0_20px_40px_-12px_rgba(26,46,26,0.12),0_0_0_1px_rgba(180,224,53,0.2)]',
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
          style={{ background: accent ? `linear-gradient(90deg, transparent, var(--accent), transparent)` : 'linear-gradient(90deg, transparent, rgba(180,224,53,0.5), transparent)' }}
        />
      )}
      {children}
    </Component>
  );
}

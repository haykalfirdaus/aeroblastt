/**
 * Shared page header for every subpage.
 *
 * Each page previously hand-rolled its own header block with slightly different
 * padding, badge markup and heading sizes — five near-copies that drifted apart.
 * This is one component with a consistent Soft UI treatment and a single fluid
 * type scale, so the pages finally look like one product.
 *
 * Server component by design: no hooks, no state, so it ships zero JS.
 */
export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="relative overflow-hidden px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-16">
      {/* Soft decorative orbs — purely presentational, transform-free */}
      <span
        aria-hidden="true"
        className="neu-orb pointer-events-none absolute -left-16 -top-14 h-40 w-40 opacity-60"
      />
      <span
        aria-hidden="true"
        className="neu-orb pointer-events-none absolute -right-12 top-8 h-24 w-24 opacity-50"
      />

      <div className="relative mx-auto max-w-2xl">
        {eyebrow && (
          <span className="neu-chip neu-rise" style={{ '--i': 0 }}>
            {eyebrow}
          </span>
        )}

        <h1
          className="neu-rise mt-5 font-display font-extrabold leading-[1.08] tracking-tight text-[#1d2b1f]"
          style={{ '--i': 1, fontSize: 'var(--text-h1)' }}
        >
          {title}
        </h1>

        {description && (
          <p
            className="neu-rise mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#4a5e3a]"
            style={{ '--i': 2 }}
          >
            {description}
          </p>
        )}

        {children && (
          <div className="neu-rise mt-6" style={{ '--i': 3 }}>
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

import { FOTBAR_IMAGES } from '@/data/fotbar';

export function FotbarSlider() {
  if (!FOTBAR_IMAGES.length) return null;

  const doubled = [...FOTBAR_IMAGES, ...FOTBAR_IMAGES];

  return (
    <section className="overflow-hidden border-y border-white/6 py-4">
      <div
        className="marquee-track flex w-max gap-3"
        style={{
          animation: 'marquee 28s linear infinite',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
        }}
      >
        {doubled.map((filename, i) => (
          <div
            key={i}
            className="h-44 w-72 shrink-0 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]"
          >
            <img
              src={`/fotbar/${filename}`}
              alt={`AeroBlast screenshot ${(i % FOTBAR_IMAGES.length) + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

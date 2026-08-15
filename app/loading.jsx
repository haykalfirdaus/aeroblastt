/*
 * Skeleton antar-halaman — fallback Suspense level route.
 *
 * Muncul otomatis SETIAP navigasi route yang chunk/datanya belum siap, jadi
 * perpindahan halaman tidak pernah terlihat "diam". Bentuknya meniru anatomi
 * halaman (header + kartu grid) dengan shimmer, bukan spinner — sesuai aturan
 * design system: "Skeletons: shimmer matching component dimensions".
 *
 * Server component tanpa state — nol JS tambahan di client.
 */
export default function Loading() {
  return (
    <div className="min-h-[100dvh] px-4 pt-28 sm:px-6" aria-busy="true" aria-label="Memuat halaman">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header halaman */}
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="neu-skel h-4 w-32 rounded-full" />
          <div className="neu-skel h-10 w-72 max-w-full rounded-2xl" />
          <div className="neu-skel h-4 w-96 max-w-full rounded-full" />
        </div>

        {/* Bar tab / filter */}
        <div className="flex justify-center gap-3 py-4">
          <div className="neu-skel h-12 w-28 rounded-full" />
          <div className="neu-skel hidden h-12 w-28 rounded-full sm:block" />
          <div className="neu-skel hidden h-12 w-28 rounded-full md:block" />
          <div className="neu-skel hidden h-12 w-28 rounded-full md:block" />
        </div>

        {/* Grid kartu */}
        <div className="grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`neu-skel h-64 rounded-[28px] ${i > 3 ? 'hidden lg:block' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

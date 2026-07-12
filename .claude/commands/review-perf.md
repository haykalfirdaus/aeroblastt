# Review Performance — Optimasi Performa & Bundle

Lakukan review performa menyeluruh pada codebase Aeroblast (React 19 + Vite 8 + Tailwind v4).

## 1. Bundle Size

- Cek apakah ada import besar yang tidak di-lazy load (selain halaman yang sudah pakai `React.lazy`)
- Verifikasi chunk splitting di `vite.config.js` sudah optimal: `react-vendor` dan `icons` harus terpisah dari main bundle
- Flag import yang menggunakan seluruh library padahal hanya butuh satu fungsi (contoh: `import _ from 'lodash'` vs `import debounce from 'lodash/debounce'`)
- GSAP: pastikan hanya plugin yang dipakai yang di-register (`ScrollToPlugin` saja, bukan semua plugin)

## 2. Rendering & Re-render

- Cari komponen yang berpotensi re-render berlebihan: state yang berubah terlalu sering di parent, prop yang membuat child selalu render ulang
- Polling hook (`useTopVoters`, `useServerStatus`) — pastikan interval sudah wajar (5 menit), bukan terlalu pendek
- Komponen list (rank, key, dll): pastikan menggunakan `key` yang stabil, bukan index array
- Periksa apakah `useCallback`/`useMemo` dibutuhkan di komponen berat (jangan over-optimize yang tidak perlu)

## 3. Asset & Image

- Cek gambar di `public/` — apakah sudah dalam format modern (WebP/AVIF) dan ukuran sudah dikompres
- Pastikan gambar dekoratif (background, slider) punya `loading="lazy"` dan ukuran yang ditetapkan (`width`/`height`) untuk mencegah layout shift (CLS)
- ParticlesCanvas: pastikan canvas resize handler sudah di-debounce dan di-cleanup saat unmount

## 4. Fetch & Caching

- Cache modul 5 menit di `useActiveAnnouncements`, `useActiveDiscounts`, `useTopVoters` sudah benar — verifikasi tidak ada fetch duplikat saat komponen mount/unmount cepat
- `useServerStatus`: cek apakah ada retry logic yang agresif yang bisa membanjiri API eksternal (`mcsrvstat.us`)

## 5. CSS & Tailwind

- Pastikan Tailwind purging berjalan benar (tidak ada class yang digenerate secara dinamis dengan string concatenation yang tidak bisa di-detect oleh Vite)
- Hindari `@apply` yang panjang di dalam `@layer utilities` — lebih baik utility class langsung di JSX

## Output yang Diharapkan

Untuk setiap temuan:
- **File & lokasi** spesifik
- **Dampak performa**: besar / sedang / kecil
- **Perbaikan konkret** dengan contoh kode jika relevan

$ARGUMENTS

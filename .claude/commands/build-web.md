# Build Web — Panduan Membuat Website Interaktif, Aman, dan Profesional

Kamu sedang membangun fitur/komponen untuk project **Aeroblast** (React 19 + Vite 8 + Tailwind CSS v4 + GSAP + Vercel). Ikuti panduan ini setiap kali membuat atau memodifikasi UI/komponen.

## Stack & Konvensi Wajib

- **Komponen**: JSX function component. Tidak pakai TypeScript, tidak pakai class component.
- **Styling**: Tailwind CSS v4 utility classes. Gunakan custom token dari `src/index.css` (`bg-void`, `text-gradient`, `glass-card`, `bg-app`, dll). **Jangan** hardcode warna di luar design system.
- **Class merge**: Gunakan `cn()` dari `src/lib/cn.js` untuk conditional classes.
- **Icon**: `lucide-react` saja. Tidak import ikon dari library lain.
- **Data produk** (rank, key, skill, balance): baca dari `src/data/` — jangan duplikasi data di komponen.
- **Harga**: selalu format dengan `formatRupiah()` dari `src/utils/currency.js`.
- **WhatsApp order**: gunakan builder dari `src/utils/whatsapp.js`, jangan buat URL manual.

## Interaktivitas

- **Animasi masuk**: gunakan AOS attribute (`data-aos`, `data-aos-delay`) — sudah diinit di `PageLayout`. Jangan panggil `AOS.init()` lagi.
- **Scroll/GSAP**: gunakan helper dari `src/lib/motion.js` (`scrollToId`, `scrollToTop`). Jangan import GSAP langsung kecuali butuh animasi kustom kompleks.
- **Motion rule**: hanya animate `transform` dan `opacity`. Cek `prefersReducedMotion()` sebelum animasi JS manual.
- **Toast**: gunakan `useToast()` dari `ToastContext` — jangan pakai `alert()` atau `console.log` untuk feedback user.
- **Modal**: gunakan hook `useEscapeKey` + `useLockBodyScroll` (sudah ada di `src/hooks/`).
- **Countdown**: gunakan `useCountdown` hook, bukan `setInterval` manual.

## Keamanan

- **Jangan** taruh secret/API key di client-side (`src/`). Semua pemanggilan API yang butuh key harus lewat `api/` (Vercel serverless).
- **Output ke DOM**: jangan gunakan `dangerouslySetInnerHTML` kecuali konten sudah di-sanitize. Untuk teks dinamis, gunakan JSX expression biasa.
- **Input user**: validasi di sisi server (`api/`), bukan hanya di client.
- **Admin auth**: selalu cek session via `useAuth()` dari `AuthContext`. Route admin wajib redirect jika `!isAdmin`.
- **WhatsApp link**: sudah aman karena pakai `buildWhatsAppLink()` — jangan buat URL order manual yang bisa di-inject.
- **Env var**: `VITE_*` hanya untuk data non-sensitif (URL publik). Kredensial (kunci API, admin secret) hanya di env server tanpa prefix `VITE_`.

## Struktur Komponen

Ikuti pola yang sudah ada:
```
src/components/
  ui/        → komponen atomic reusable (Button, Badge, Modal, GlassCard)
  layout/    → shell halaman (PageLayout, Navbar, Footer)
  home/      → section-section HomePage
  store/     → tab dan modal StorePage
  faq/       → komponen FaqPage
```

Komponen baru taruh di folder yang sesuai. Jika reusable lintas halaman → `ui/`. Jika spesifik satu halaman → folder halaman tersebut.

## Fetch Data

- Gunakan custom hook yang sudah ada sebelum buat hook baru:
  - Data voter → `useTopVoters`
  - Announcements → `useActiveAnnouncements`
  - Discounts → `useActiveDiscounts`
  - Server status → `useServerStatus`
- Semua fetch ke API internal (`/api/...`) sudah punya cache 5 menit di module level — jangan tambah cache lagi.
- Fetch ke API eksternal dari client harus diproksikan lewat `api/` serverless supaya API key tidak terekspos.

## Checklist Sebelum Selesai

- [ ] Tidak ada warna hardcode di luar token design system
- [ ] Tidak ada secret di `src/`
- [ ] Animasi respek `prefers-reduced-motion`
- [ ] Teks harga menggunakan `formatRupiah()`
- [ ] Komponen baru ada di folder yang tepat
- [ ] Modal/overlay pakai `useEscapeKey` + `useLockBodyScroll`
- [ ] Feedback ke user pakai `useToast()`, bukan alert
- [ ] Route admin dilindungi cek `isAdmin`

$ARGUMENTS

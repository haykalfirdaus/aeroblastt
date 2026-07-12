# Animasi — Panduan Animasi Optimal & Indah

Gunakan panduan ini setiap kali menambah atau memperbaiki animasi di project Aeroblast.

## Prinsip Utama

1. **GPU-only**: hanya animate `transform` (translate, scale, rotate) dan `opacity`. Jangan animate `width`, `height`, `top`, `left`, `margin`, `padding` — itu memicu layout reflow yang berat.
2. **Respek pengguna**: selalu cek `prefersReducedMotion()` dari `src/lib/motion.js` sebelum animasi JS manual. Animasi dekoratif wajib dinonaktifkan, tapi transisi informatif (loading state, toast) boleh tetap jalan.
3. **Jangan block interaksi**: animasi masuk tidak boleh menghalangi user klik/scroll. Gunakan `pointer-events: none` selama animasi jalan jika perlu.

## Kapan Pakai Apa

| Kebutuhan | Tool | Cara |
|---|---|---|
| Elemen muncul saat scroll | AOS | `data-aos="fade-up"` di JSX |
| Scroll smooth ke section | GSAP | `scrollToId(id)` dari `src/lib/motion.js` |
| Animasi kompleks / timeline | GSAP | Import langsung, cleanup di `useEffect` return |
| Hover/focus state sederhana | Tailwind | `transition-all duration-200 hover:scale-105` |
| Loading skeleton | Tailwind | `animate-pulse` |
| Ticker/marquee | CSS `@keyframes` | Sudah ada di `src/index.css` |

## AOS (Animate On Scroll)

```jsx
// Dasar
<div data-aos="fade-up">...</div>

// Dengan delay (untuk stagger list)
{items.map((item, i) => (
  <div key={item.id} data-aos="fade-up" data-aos-delay={i * 100}>
    {/* max delay 400ms agar tidak terasa lambat */}
  </div>
))}
```

**AOS yang direkomendasikan untuk project ini:**
- `fade-up` — konten utama, card
- `fade-in` — gambar, background element
- `zoom-in` — badge, tag kecil
- `slide-right` / `slide-left` — pasangan elemen kiri-kanan

**Hindari:** `flip-*`, `rotate-*` — terlalu mencolok untuk UI profesional dark theme.

## GSAP — Animasi Kustom

```jsx
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '@/lib/motion'

export function AnimatedCard({ children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power2.out',
      })
    }, ref)

    return () => ctx.revert() // wajib cleanup
  }, [])

  return <div ref={ref}>{children}</div>
}
```

**Easing yang sesuai dark gaming theme ini:**
- `power2.out` / `power3.out` — masuk elemen (cepat masuk, smooth berhenti)
- `power2.inOut` — transisi state
- `expo.out` — efek dramatis untuk hero atau modal
- Hindari `bounce` dan `elastic` — terasa childish untuk UI server store

## Tailwind Transitions

```jsx
// Hover card — scale subtle
<div className="transition-transform duration-200 hover:scale-[1.02]">

// Button press feedback
<button className="transition-all duration-150 active:scale-95">

// Fade conditional
<div className={cn(
  'transition-opacity duration-300',
  isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
)}>
```

**Durasi yang tepat:**
- `duration-150` — feedback klik/press
- `duration-200` — hover state
- `duration-300` — fade in/out panel, modal overlay
- `duration-500` — transisi halaman, banner
- Lebih dari 500ms terasa lambat kecuali ada alasan kuat

## Stagger Pattern (List Animasi)

```jsx
// AOS stagger — paling mudah
{ranks.map((rank, i) => (
  <RankCard
    key={rank.id}
    rank={rank}
    data-aos="fade-up"
    data-aos-delay={Math.min(i * 80, 320)} // cap di 320ms
  />
))}

// GSAP stagger — untuk kontrol lebih
gsap.from('.rank-card', {
  opacity: 0, y: 20,
  duration: 0.5,
  stagger: 0.08,
  ease: 'power2.out',
})
```

## Checklist Animasi

- [ ] Hanya animate `transform` dan `opacity`
- [ ] Ada guard `prefersReducedMotion()` untuk animasi JS manual
- [ ] GSAP `useEffect` punya `return () => ctx.revert()`
- [ ] Delay stagger tidak lebih dari 400ms total
- [ ] Easing sesuai konteks (bukan bounce/elastic untuk UI profesional)
- [ ] Tidak ada animasi yang block klik/scroll user

$ARGUMENTS

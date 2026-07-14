# Desain Warna & Layout — Panduan Visual Profesional

Gunakan panduan ini saat memilih warna, menyusun layout, atau mendesain komponen baru untuk Aeroblast.

## Design System Ini

Project menggunakan dark space/gaming aesthetic. Semua token sudah didefinisikan di `src/index.css` dalam `@theme`.

### Palet Background (dari paling gelap ke terang)
```
--color-void     #030711   ← background utama halaman (bg-void)
--color-abyss               ← section gelap dalam void
--color-deep                ← card dalam section
--color-panel               ← panel, sidebar, dropdown
--color-surface             ← elemen paling "terang" (input, highlight)
```
Gunakan urutan ini secara konsisten: void → abyss → deep → panel → surface (selalu lebih terang dari parent-nya).

### Accent Colors
```
--color-neon-500  #3b82f6  ← biru elektrik (primary CTA, link aktif, border focus)
--color-cyan-400  #22d3ee  ← cyan (secondary, highlight data, badge info)
```

### Warna Rank (sudah ada tokennya)
```
--color-rank-scout      ← tier paling rendah
--color-rank-explorer
--color-rank-knight
--color-rank-elite
--color-rank-master
--color-rank-legend
--color-rank-mythic
--color-rank-universe   ← tier tertinggi
```
Selalu gunakan token rank, jangan hardcode hex warna rank.

## Aturan Pemilihan Warna

### ✅ Boleh
- Teks utama: `text-white` atau `text-slate-100`
- Teks sekunder/deskripsi: `text-slate-400` atau `text-slate-500`
- Border subtle: `border-white/10` atau `border-slate-700/50`
- Glow/shadow aksen: `shadow-neon-500/20` dengan `box-shadow`
- Gradient teks heading: gunakan class `.text-gradient` yang sudah ada
- Overlay gelap: `bg-black/40` sampai `bg-black/70`

### ❌ Hindari
- Warna terang di atas background gelap yang low-contrast (rasio minimal 4.5:1 untuk teks)
- Merah/oranye untuk elemen dekoratif (reserved untuk error/warning state)
- Warna di luar design system (jangan hardcode `#fff`, `#000`, hex arbitrary)
- Terlalu banyak accent sekaligus — pilih satu (biru atau cyan), bukan dua sekaligus di satu komponen

## Pola Layout yang Benar

### Container
```jsx
// Selalu pakai container dengan padding konsisten
<section className="container mx-auto px-4 sm:px-6 lg:px-8">
```

### Card / Panel
```jsx
// Glass card — untuk konten utama
<div className="glass-card rounded-xl p-6">

// Glass minimal — untuk sidebar, info box
<div className="glass-minimal rounded-lg p-4">

// Card rank/produk — border aksen tipis
<div className="bg-deep border border-white/10 rounded-xl p-5 hover:border-neon-500/30 transition-colors">
```

### Grid Produk
```jsx
// 1 kolom mobile → 2 tablet → 3 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Untuk rank (8 item) — 2 → 4
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
```

### Spacing Konsisten
- Section padding vertikal: `py-16 md:py-24`
- Antara heading dan konten: `mt-4` atau `mt-6`
- Antara card: `gap-4` (kompak) atau `gap-6` (lega)
- Jangan gunakan margin bottom di komponen — biarkan parent yang atur gap

## Hierarki Tipografi

```jsx
// Heading utama halaman
<h1 className="text-4xl md:text-6xl font-bold font-display text-gradient">

// Heading section
<h2 className="text-2xl md:text-3xl font-bold font-display text-white">

// Sub-heading / label
<h3 className="text-lg font-semibold text-slate-200">

// Body teks
<p className="text-slate-400 leading-relaxed">

// Label kecil / badge
<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">

// IP/kode/monospace
<code className="font-mono text-cyan-400">
```

## Efek Visual yang Sesuai Tema

```jsx
// Glow di belakang elemen penting (hero, CTA utama)
<div className="absolute inset-0 bg-neon-500/10 blur-3xl rounded-full -z-10" />

// Border aksen dengan opacity rendah
<div className="border border-neon-500/20 rounded-xl">

// Badge rank / status
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
  bg-neon-500/10 border border-neon-500/20 text-neon-500 text-xs font-medium">

// Divider subtle
<hr className="border-white/5" />
```

## Checklist Desain

- [ ] Semua warna dari token `--color-*` atau Tailwind slate/white/opacity
- [ ] Kontras teks minimal 4.5:1 terhadap background
- [ ] Satu accent dominan per komponen (biru atau cyan, bukan keduanya)
- [ ] Background mengikuti urutan void → abyss → deep → panel → surface
- [ ] Tidak ada margin bottom di komponen — pakai gap di parent
- [ ] Heading pakai `font-display` (Space Grotesk), body pakai Inter default

$ARGUMENTS

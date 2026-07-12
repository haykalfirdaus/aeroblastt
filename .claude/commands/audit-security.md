# Audit Security — Cek Celah Keamanan

Lakukan audit keamanan menyeluruh pada kode project Aeroblast. Fokus pada area berikut:

## 1. Secrets & Environment Variables
- Cari string yang mirip API key, token, password, atau secret yang hardcode di `src/` (client-side)
- Pastikan variabel env sensitif (`VOTERS_API_KEY`, `ADMIN_SECRET`) hanya dipakai di `api/`, bukan di `src/`
- Periksa apakah `.env*` sudah ada di `.gitignore`
- Pastikan tidak ada fallback hardcode untuk secret di `api/` — semua secret wajib dari env var, fail closed jika tidak ada

## 2. Autentikasi & Sesi Admin
- Verifikasi setiap endpoint `api/admin/*` yang mutasi data (POST/DELETE) sudah memanggil fungsi verifikasi sesi sebelum eksekusi
- Periksa cookie `aeroblast_admin_session` sudah di-set dengan flag `HttpOnly`, `Secure`, dan `SameSite=Strict`
- Cek token HMAC-SHA256 di `api/admin/verify.js` — pastikan menggunakan `timingSafeEqual` (bukan `===`) untuk mencegah timing attack
- Pastikan route `/admin` di frontend redirect jika `!isAdmin` dari `AuthContext`

## 3. Injeksi & XSS
- Cari semua penggunaan `dangerouslySetInnerHTML` — verifikasi konten sudah di-sanitize atau ganti dengan JSX biasa
- Periksa semua URL yang dibangun dari input user (WhatsApp link builder, dll) — pastikan tidak ada open redirect
- Cek semua parameter query string yang langsung dirender ke DOM

## 4. API Serverless
- Pastikan semua handler `api/` memvalidasi `Content-Type` dan method HTTP (reject method yang tidak diizinkan dengan 405)
- Periksa apakah ada endpoint yang tidak membatasi ukuran body request (bisa jadi vektor DoS)
- Verifikasi response header keamanan di `vercel.json` sudah ada: `X-Content-Type-Options`, `X-Frame-Options`
- Periksa CORS policy — endpoint publik sebaiknya tidak `Access-Control-Allow-Origin: *` jika memproses data sensitif

## 5. Dependensi
- Jalankan `npm audit` dan flag semua severity `high` atau `critical`
- Cek apakah versi paket utama (React, Vite, GSAP) sudah up-to-date

## Output yang Diharapkan

Untuk setiap temuan, berikan:
- **File & baris** tempat masalah ditemukan
- **Tingkat risiko**: Kritis / Tinggi / Sedang / Rendah
- **Penjelasan singkat** kenapa ini bermasalah
- **Rekomendasi perbaikan** yang konkret dan spesifik untuk codebase ini

$ARGUMENTS

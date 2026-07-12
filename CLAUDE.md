# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # Run oxlint
```

No test runner is configured.

**Import alias**: `@/` resolves to `src/` (configured in `vite.config.js`). Use `@/components/...`, `@/lib/...`, etc. — nearly all imports use this alias, not relative paths.

## Architecture Overview

This is a **React 19 + Vite 8 + Tailwind CSS v4** SPA for an Indonesian Minecraft server store (Aeroblast), deployed on Vercel with serverless API routes.

### Entry Flow

`index.html` → `src/main.jsx` → `src/App.jsx`

`App.jsx` wraps everything in `BrowserRouter > ToastProvider > AuthProvider`, then renders all pages via `React.lazy()` + `Suspense`. A `ScrollManager` side effect handles cross-route scroll restoration.

### Pages (lazy-loaded)

| Route | File |
|---|---|
| `/` | `src/pages/HomePage.jsx` |
| `/store` | `src/pages/StorePage.jsx` |
| `/top-voters` | `src/pages/TopVotersPage.jsx` |
| `/faq` | `src/pages/FaqPage.jsx` |
| `/terms` | `src/pages/TermsPage.jsx` |
| `/admin/login` | `src/pages/AdminLoginPage.jsx` |
| `/admin` | `src/pages/AdminDashboardPage.jsx` |
| `*` (catch-all) | `src/pages/NotFoundPage.jsx` |

### Component Structure

```
src/components/
  layout/   → PageLayout, Navbar, Footer, ParticlesCanvas, AnnouncementBanner, AnnouncementTicker
  home/     → HeroSection, FeaturesSection, GallerySlider, RulesSection, SpecialRanksSection, TopVotersPreview
  store/    → RankTab, GachaKeysTab, SkillBoostTab, BalanceTab, CommandsTab, CosmeticsTab,
              RankOrderModal, PaymentMethodPicker, PriceSummary, DiscountCodeInput, CountdownBanner
  faq/      → Accordion, FaqAnswer
  ui/       → Button, Badge, GlassCard, Modal, SectionHeading, CustomSelect, FormFields
```

`PageLayout` renders the dark grid shell (`bg-app`), `ParticlesCanvas`, `Navbar`, `<main>`, and `Footer`, and calls `AOS.init()` on mount.

### State Management

- **`AuthContext`** (`src/context/AuthContext.jsx`): Admin session. Calls `/api/admin/verify` on mount. Exposes `{ isAdmin, loading, login, logout }`. Uses React 19 `use()` API.
- **`ToastContext`** (`src/context/ToastContext.jsx`): Imperative toast notifications via `useToast()`. Toasts auto-dismiss after 3.5s.

### Custom Hooks (`src/hooks/`)

| Hook | Purpose |
|---|---|
| `useServerStatus` | Polls `mcsrvstat.us` for Minecraft server status |
| `useTopVoters` | Fetches `/api/voters`, refreshes every 5 min |
| `useActiveAnnouncements` | Fetches `/api/admin/announcements`, 5-min module cache |
| `useActiveDiscounts` | Fetches `/api/admin/discounts`, 5-min module cache |
| `useCountdown` | Countdown timer for promotions |
| `useClipboard` | Copy-to-clipboard with transient confirmation state |
| `useEscapeKey` | Runs a callback on Escape keypress (modals) |
| `useLockBodyScroll` | Locks `<body>` scroll while a modal/overlay is open |
| `useScrollReveal` | Scroll-triggered reveal animation helper |

### Utility Libraries

- `src/lib/cn.js` — minimal `clsx` substitute (filter falsy + join)
- `src/lib/motion.js` — GSAP + AOS helpers: `initAOS()`, `scrollToId(id)`, `scrollToTop()`, `prefersReducedMotion()`
- `src/utils/currency.js` — `formatRupiah()`, `formatNumber()` for Indonesian locale
- `src/utils/discount.js` — `fetchActiveDiscounts()`, `checkDiscountCode()` with 1-min in-memory cache
- `src/utils/whatsapp.js` — WhatsApp link builders for all order types (`buildRankOrderMessage`, `buildKeyOrderMessage`, etc.)

### Static Product Data (`src/data/`)

All store inventory is static JS modules — no backend CMS. Central site config lives in `src/data/config.js` (server IP, WhatsApp number, payment methods, social links). Products: `ranks.js`, `keys.js`, `skills.js`, `balance.js`, `commands.js`.

### Serverless API (`api/`)

Vercel-compatible Node.js handlers. Announcements dan discounts disimpan di **Supabase PostgreSQL** (bukan `/tmp/` lagi — data persisten tidak hilang saat cold start).

| Endpoint | Auth |
|---|---|
| `GET /api/voters` | Public — proxies minecraft-mp.com, hides `VOTERS_API_KEY` |
| `POST /api/admin/login` | Public — sets `aeroblast_admin_session` HttpOnly cookie (7-day HMAC-SHA256 token) |
| `GET/POST/DELETE /api/admin/announcements` | GET public; mutations require admin session cookie |
| `GET/POST/DELETE /api/admin/discounts` | GET public; mutations require admin session cookie |

**Database**: Supabase project `rkbnmrsglhmuchganiaq`. Tabel: `announcements`, `discounts`. Shared helper `api/_supabase.js` (service role client). Schema SQL ada di `supabase-migration.sql`.

Admin auth is a custom HMAC-SHA256 token scheme (no third-party JWT library). The signing key is the `ADMIN_SECRET` env var (fallback hardcoded — must be set in production).

### Design System

Defined in `src/index.css` using Tailwind v4's `@theme` block.

- **Background scale**: `--color-void` (#030711) → `--color-abyss` → `--color-deep` → `--color-panel` → `--color-surface` (dark navy)
- **Accents**: Electric blue `--color-neon-500` (#3b82f6), cyan `--color-cyan-400` (#22d3ee)
- **Fonts**: Space Grotesk (headings), Inter (body), JetBrains Mono (monospace/IP display)
- **Motion rule**: Only animate `transform` and `opacity` (GPU-only). All animations are disabled when `prefers-reduced-motion` is set, except the announcement ticker (treated as content).
- **Rank colors**: 8 tokens from `--color-rank-scout` through `--color-rank-universe`

Key utility classes defined in `@layer utilities`: `.bg-app`, `.hero-bg`, `.text-gradient`, `.glass-minimal`, `.glass-card`.

### Environment Variables

| Variable | Used in | Notes |
|---|---|---|
| `VITE_SITE_URL` | `src/data/config.js` | Defaults to `https://store.aeroblast.my.id` |
| `VOTERS_API_KEY` | `api/voters.js` | Server-side only; required (no fallback) |
| `ADMIN_SECRET` | `api/_auth.js` | Signs HMAC session tokens; required (no fallback — throws if unset) |
| `ADMIN_USERNAME` | `api/admin/login.js` | Admin username; required (no fallback) |
| `ADMIN_PASSWORD` | `api/admin/login.js` | Admin password; required (no fallback) |
| `ALLOWED_ORIGIN` | `api/_auth.js`, `api/admin/login.js` | Strict CORS origin; defaults to `https://store.aeroblast.my.id` |
| `SUPABASE_URL` | `api/_supabase.js` | Supabase project URL; required (no fallback) |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/_supabase.js` | Service role key — server-side only, required (no fallback), never expose to client |

Create `.env.local` for local development (never commit — it is gitignored). Use your own rotated secrets:
```
ADMIN_SECRET=<random-long-secret>
ADMIN_USERNAME=<your-admin-username>
ADMIN_PASSWORD=<your-admin-password>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
VOTERS_API_KEY=<voters-api-key>
```

All API secrets are **required with no hardcoded fallback** — a missing env var makes the handler fail closed (throws / 500) rather than fall back to an insecure default. Set them all in the Vercel dashboard (Settings → Environment Variables) for production.

### Anti-Tampering / Source Obfuscation

Two layers protect the client, and both affect the dev/debug experience:

- **`src/utils/devtools-protection.js`** — mounted via `<DevtoolsWarningOverlay>` in `App.jsx`. Blocks F12, `Ctrl+Shift+I/J/C`, `Ctrl+U`, and right-click; detects open DevTools by window-size delta (>160px) and shows a full-screen blocking overlay. Expect right-click and DevTools shortcuts to be suppressed when running the built/dev site.
- **`vite.config.js` build** — Terser with `mangle.toplevel`, `drop_console` in production, hashed generic filenames (`assets/js/[hash].js`), no sourcemaps. Vendor code is split into `react-vendor` and `icons` chunks. Production bundles are intentionally unreadable; debug against source, not `dist/`.

### Deployment

- **Vercel**: Primary. `vercel.json` rewrites all non-`/api/` paths to `index.html`. Assets under `/assets/**` are cached with `Cache-Control: immutable, max-age=31536000`.
- **Cloudflare Pages**: Supported via `public/_redirects` SPA fallback.

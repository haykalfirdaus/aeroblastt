# AeroBlast Network — Website

Modern React + Vite + Tailwind CSS v4 rebuild of the AeroBlast Minecraft server website.

## Tech Stack

| Tool | Version |
|---|---|
| React | 19 |
| React Router | 7 |
| Vite | 8 |
| Tailwind CSS | 4 |
| lucide-react | latest |

## Quick Start

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
# Output → dist/
```

## Deploy

### Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- `public/_redirects` handles SPA routing automatically.

### Vercel
- Import repo → Vercel auto-detects Vite.
- `vercel.json` handles SPA rewrites automatically.

## Pages / Routes

| Route | Page |
|---|---|
| `/` | Beranda (Home) |
| `/store` | Store (Rank, Keys, Skill, Balance, Commands, Cosmetics) |
| `/top-voters` | Leaderboard Voter |
| `/faq` | FAQ |
| `/terms` | Syarat & Ketentuan |

## Environment Variables (optional)

Create `.env.local`:
```
VITE_SITE_URL=https://store.aeroblast.my.id
```

-- ============================================================
-- Aeroblast Admin Panel — Supabase Migration
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Tabel announcements
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  text        text        not null check (char_length(text) <= 500),
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Tabel discounts
create table if not exists public.discounts (
  id          uuid primary key default gen_random_uuid(),
  code        text        not null unique,
  percent     integer     not null check (percent >= 1 and percent <= 100),
  categories  text[]      not null default '{}',
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Index untuk query expired filter (dipakai di GET public)
create index if not exists idx_announcements_expires_at on public.announcements (expires_at);
create index if not exists idx_discounts_expires_at     on public.discounts     (expires_at);
create index if not exists idx_discounts_code           on public.discounts     (lower(code));

-- Row Level Security: aktifkan tapi biarkan service_role bebas (bypass RLS)
alter table public.announcements enable row level security;
alter table public.discounts     enable row level security;

-- Policy: publik hanya boleh SELECT baris yang belum expired
create policy "public read active announcements"
  on public.announcements for select
  using (expires_at > now());

create policy "public read active discounts"
  on public.discounts for select
  using (expires_at > now());

-- service_role (server API) bypass RLS otomatis — tidak perlu policy tambahan

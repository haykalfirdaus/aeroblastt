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

-- ============================================================
-- Tabel invoices — order masuk dari store, expire 24 jam
-- ============================================================

create table if not exists public.invoices (
  id             uuid        primary key default gen_random_uuid(),
  type           text        not null,
  nick           text        not null,
  platform       text        not null,
  final_amount   integer     not null check (final_amount > 0),
  payment_method text        not null,
  details        jsonb       not null default '{}',
  paid           boolean     not null default false,
  paid_at        timestamptz,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_invoices_expires_at on public.invoices (expires_at);
create index if not exists idx_invoices_paid_paid_at on public.invoices (paid, paid_at);

alter table public.invoices enable row level security;

-- Tidak ada policy publik — hanya service_role (admin API) yang bisa akses

-- Beta Payment System: GoPay Static QRIS + Unique Amount
-- Jalankan di Supabase SQL Editor

-- Tabel utama order pembayaran
create table if not exists beta_orders (
  id uuid primary key default gen_random_uuid(),
  suffix integer not null,                 -- angka unik 1-999 (recycled, tidak unique constraint)
  nick text not null,
  platform text not null,
  type text not null,
  base_amount integer not null,
  total_amount integer not null,
  details jsonb not null default '{}',
  status text not null default 'pending',  -- pending | paid | expired
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  paid_at timestamptz
);

create index if not exists beta_orders_total_amount_status
  on beta_orders (total_amount, status);

create index if not exists beta_orders_suffix_status
  on beta_orders (suffix, status);

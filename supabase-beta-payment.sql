-- Beta Payment System: GoPay Static QRIS + Unique Amount
-- Jalankan di Supabase SQL Editor

-- Tabel utama order pembayaran
create table if not exists beta_orders (
  id uuid primary key default gen_random_uuid(),
  suffix integer not null unique,          -- angka unik 1001-2000
  nick text not null,                      -- username MC
  platform text not null,                  -- Java / Bedrock
  type text not null,                      -- rank, key, skill, balance, command, cosmetic
  base_amount integer not null,            -- harga asli (tanpa suffix)
  total_amount integer not null,           -- base_amount + suffix = yang harus dibayar
  details jsonb not null default '{}',     -- info produk (rank, keyName, qty, dll)
  status text not null default 'pending',  -- pending | paid | expired | failed
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,         -- default 30 menit
  paid_at timestamptz
);

-- Index untuk cari order berdasarkan total_amount (matching dari Tasker)
create index if not exists beta_orders_total_amount_status
  on beta_orders (total_amount, status);

-- Index untuk cari suffix yang masih pending (buat pool)
create index if not exists beta_orders_suffix_status
  on beta_orders (suffix, status);

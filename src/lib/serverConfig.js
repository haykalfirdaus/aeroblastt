/**
 * Server-only reader untuk alamat server Minecraft (IP + port).
 *
 * Nilai live disimpan di tabel Supabase `server_config` supaya admin bisa
 * menggantinya dari panel admin tanpa perlu redeploy. Env var tidak dipakai
 * untuk ini: di Vercel, NEXT_PUBLIC_* di-inline saat build dan env server
 * di-snapshot per-deployment — keduanya butuh redeploy untuk berubah.
 *
 * JANGAN impor file ini dari client component; pakai useServerConfig()
 * dari @/context/ServerConfigContext.
 */

import { unstable_cache } from 'next/cache';
import { supabase } from '@/api/_supabase';
import { SITE } from '@/data/config';

export const SERVER_CONFIG_TAG = 'server-config';

/** Nilai cadangan saat Supabase belum dikonfigurasi atau gagal dibaca. */
const FALLBACK = { ip: SITE.server.ip, port: SITE.server.port };

async function readServerConfig() {
  // supabase null saat env belum diset (mis. build time) — pakai fallback.
  if (!supabase) return FALLBACK;

  const { data, error } = await supabase
    .from('server_config')
    .select('ip, port')
    .eq('id', true)
    .maybeSingle();

  // Tabel kosong / belum dimigrasi / Supabase down → jangan sampai situs
  // menampilkan IP kosong; jatuh ke default.
  if (error || !data?.ip || !data?.port) return FALLBACK;

  return { ip: data.ip, port: data.port };
}

/**
 * Dibaca sekali lalu di-cache sampai admin menyimpan perubahan, yang memanggil
 * revalidateTag(SERVER_CONFIG_TAG) — jadi pengunjung biasa tidak menimbulkan
 * query Supabase sama sekali.
 */
export const getServerConfig = unstable_cache(readServerConfig, ['server-config'], {
  tags: [SERVER_CONFIG_TAG],
});

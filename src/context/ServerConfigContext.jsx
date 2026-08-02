'use client';
import { createContext, use } from 'react';
import { SITE } from '@/data/config';

/**
 * Alamat server Minecraft (IP + port) yang dibaca dari Supabase di
 * app/layout.jsx lalu disebar ke komponen client.
 *
 * Nilai default = SITE.server, jadi komponen tetap menampilkan sesuatu yang
 * masuk akal kalau kebetulan dirender di luar provider.
 */
const ServerConfigContext = createContext({ ip: SITE.server.ip, port: SITE.server.port });

export function ServerConfigProvider({ value, children }) {
  return <ServerConfigContext value={value}>{children}</ServerConfigContext>;
}

/** Returns { ip, port } — alamat server yang sedang aktif. */
export function useServerConfig() {
  return use(ServerConfigContext);
}

/** URL status mcsrvstat diturunkan dari ip:port. */
export function buildStatusApi(ip, port) {
  return `https://api.mcsrvstat.us/2/${ip}:${port}`;
}

/**
 * Ganti placeholder {{ip}} / {{port}} di teks statis (dipakai FAQ).
 * Dibuat di sini supaya sisi client bisa memakainya tanpa menyentuh
 * modul server-only di @/lib/serverConfig.
 */
export function substituteServerVars(text, { ip, port }) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{ip\}\}/g, ip).replace(/\{\{port\}\}/g, port);
}

'use client';
import { useEffect, useState } from 'react';
import { initDevtoolsProtection, onDevtoolsChange } from '@/utils/devtools-protection';

export function DevtoolsWarningOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    initDevtoolsProtection();
    const unsubscribe = onDevtoolsChange(setOpen);
    return unsubscribe;
  }, []);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(3,7,17,0.97)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)', padding: '2rem', textAlign: 'center',
      }}
    >
      <div style={{ width: 88, height: 88, borderRadius: '50%', border: '2px solid rgba(239,68,68,0.4)', boxShadow: '0 0 40px rgba(239,68,68,0.25), inset 0 0 40px rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', background: 'rgba(239,68,68,0.06)' }}>
        <span style={{ fontSize: 38 }}>⛔</span>
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
        Akses Tidak Diizinkan
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: '#8ea0b8', maxWidth: 380, lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Developer Tools terdeteksi terbuka. Tutup DevTools untuk melanjutkan menggunakan situs ini.
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
        <span style={{ opacity: 0.6 }}>Tekan</span>
        <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem' }}>F12</kbd>
        <span style={{ opacity: 0.6 }}>untuk menutup DevTools</span>
      </div>
      <p style={{ marginTop: '2rem', fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', color: '#435268' }}>
        AeroBlast Security &mdash; Unauthorized access is monitored
      </p>
    </div>
  );
}

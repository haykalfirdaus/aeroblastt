'use client';
import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Check, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createBetaOrder, pollBetaOrderStatus } from '@/utils/betaPayment';
import { formatRupiah } from '@/utils/currency';
import { QrisDisplay } from './QrisDisplay';
import { cn } from '@/lib/cn';

const POLL_INTERVAL = 5000;

function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isUrgent = remaining !== 'Expired' && parseInt(remaining) < 5;

  return (
    <span className={cn('font-mono font-bold tabular-nums', isUrgent ? 'text-[#a3271f]' : 'text-[#1d2b1f]')}>
      {remaining}
    </span>
  );
}

// Status: idle | loading | waiting | paid | expired | failed
export function BetaPaymentModal({ open, onClose, orderPayload, productLabel }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const pollRef = useRef(null);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => {
    if (!open) {
      stopPolling();
      setStatus('idle');
      setOrder(null);
      setError('');
    }
  }, [open]);

  async function handleCreate() {
    setStatus('loading');
    setError('');
    try {
      const result = await createBetaOrder(orderPayload);
      setOrder(result);
      setStatus('waiting');
      startPolling(result.orderId, result.expiresAt);
    } catch (err) {
      setError(err.message);
      setStatus('failed');
    }
  }

  function startPolling(orderId, expiresAt) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (new Date(expiresAt) < new Date()) {
        stopPolling();
        setStatus('expired');
        return;
      }
      try {
        const result = await pollBetaOrderStatus(orderId);
        if (result.status === 'paid') {
          stopPolling();
          setStatus('paid');
        } else if (result.status === 'expired') {
          stopPolling();
          setStatus('expired');
        }
      } catch { /* abaikan error polling sementara */ }
    }, POLL_INTERVAL);
  }

  function handleClose() {
    stopPolling();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Pembayaran QRIS" size="sm">
      <div className="mt-4 flex flex-col gap-4">

        {/* IDLE */}
        {status === 'idle' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3.5 shadow-[var(--neu-in)]">
              <p className="text-sm text-[#4a5e3a] leading-relaxed">
                Bayar <span className="font-semibold text-[#1d2b1f]">{productLabel}</span> lewat QRIS.
                Nominalnya <span className="font-semibold text-[#1d2b1f]">sudah otomatis terisi</span> saat di-scan — item masuk otomatis setelah pembayaran terdeteksi.
              </p>
            </div>
            <Button fullWidth onClick={handleCreate} variant="primary">
              Tampilkan Kode QRIS
            </Button>
          </div>
        )}

        {/* LOADING */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d8cfc0] border-t-[#4a5e3a]" />
            <p className="text-sm text-[#4a5e3a]">Menyiapkan pembayaran...</p>
          </div>
        )}

        {/* WAITING */}
        {status === 'waiting' && order && (
          <div className="flex flex-col items-center gap-3">
            {/* Nominal */}
            <div className="w-full rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 text-center shadow-[var(--neu-in)]">
              <p className="text-[11px] text-[#4a5e3a]">Transfer TEPAT sebesar</p>
              <p className="text-2xl font-bold tracking-tight text-[#1d2b1f]">{formatRupiah(order.totalAmount)}</p>
              <p className="mt-0.5 text-[11px] text-[#4a5e3a]">
                Sisa waktu: <CountdownTimer expiresAt={order.expiresAt} />
              </p>
            </div>

            {/* QRIS */}
            <QrisDisplay payload={order.qris} amount={order.totalAmount} label={productLabel} />

            {/* Polling indicator */}
            <div className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-neu)] bg-[#fff8f0] py-2.5 shadow-[var(--neu-in)]">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5a7048] opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5a7048]" />
              </span>
              <p className="text-[11px] text-[#4a5e3a]">Menunggu konfirmasi pembayaran...</p>
            </div>
          </div>
        )}

        {/* PAID */}
        {status === 'paid' && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="neu-icon h-20 w-20 rounded-[24px]">
              <Check size={34} aria-hidden="true" className="text-[#4a5e3a]" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#1d2b1f]">Pembayaran Berhasil!</p>
              <p className="mt-2 text-sm text-[#4a5e3a] leading-relaxed">
                <span className="font-semibold text-[#1d2b1f]">{productLabel}</span> sedang diproses ke akun kamu.<br />
                Masuk ke server — item akan sudah aktif.
              </p>
            </div>
            <Button fullWidth variant="ghost" onClick={handleClose}>Tutup</Button>
          </div>
        )}

        {/* EXPIRED */}
        {status === 'expired' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="neu-icon h-16 w-16 rounded-[20px]">
              <Clock size={28} aria-hidden="true" className="text-[#4a5e3a]" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1d2b1f]">Waktu Habis</p>
              <p className="mt-1 text-sm text-[#4a5e3a]">
                Sesi pembayaran sudah berakhir. Buat order baru untuk melanjutkan.
              </p>
            </div>
            <Button fullWidth onClick={handleCreate}>Buat Order Baru</Button>
          </div>
        )}

        {/* FAILED */}
        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="neu-icon h-16 w-16 rounded-[20px]">
              <AlertTriangle size={26} aria-hidden="true" className="text-[#a3271f]" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#a3271f]">Gagal Memproses</p>
              <p className="mt-1 text-sm text-[#4a5e3a]">{error}</p>
            </div>
            <Button fullWidth onClick={handleCreate}>Coba Lagi</Button>
          </div>
        )}

      </div>
    </Modal>
  );
}

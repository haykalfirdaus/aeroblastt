'use client';
import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createBetaOrder, pollBetaOrderStatus } from '@/utils/betaPayment';
import { formatRupiah } from '@/utils/currency';
import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const POLL_INTERVAL = 5000;
const QRIS_IMG = SITE.payment.QRIS?.imgPath || '/payment/qris.png';

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
    <span className={cn('font-mono font-bold tabular-nums', isUrgent ? 'text-red-500' : 'text-[#1d2b1f]')}>
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
            <div className="rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] px-4 py-3">
              <p className="text-sm text-[#4a5e3a] leading-relaxed">
                Bayar <span className="font-semibold text-[#1d2b1f]">{productLabel}</span> dengan nominal unik yang akan ditampilkan.
                Scan QRIS dan transfer <span className="font-semibold text-[#1d2b1f]">tepat sesuai nominal</span> — item masuk otomatis setelah pembayaran terdeteksi.
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
            <div className="h-8 w-8 animate-spin rounded-md border-2 border-[#BFFF5E] border-t-transparent" />
            <p className="text-sm text-[#4a5e3a]">Menyiapkan pembayaran...</p>
          </div>
        )}

        {/* WAITING */}
        {status === 'waiting' && order && (
          <div className="flex flex-col items-center gap-5">
            {/* Nominal */}
            <div className="w-full rounded-md border border-[#BFFF5E]/25 bg-[#BFFF5E]/8 px-4 py-3 text-center">
              <p className="text-xs text-[#4a5e3a] mb-1">Transfer TEPAT sebesar</p>
              <p className="text-3xl font-bold tracking-tight text-[#1d2b1f]">{formatRupiah(order.totalAmount)}</p>
              <p className="mt-1.5 text-xs text-[#4a5e3a]">
                Sisa waktu: <CountdownTimer expiresAt={order.expiresAt} />
              </p>
            </div>

            {/* QRIS */}
            <div className="rounded-md border border-2 border-[#1d2b1f] bg-white p-3 shadow-lg">
              <img src={QRIS_IMG} alt="QRIS AeroBlast" className="h-52 w-52 object-contain" />
            </div>

            <p className="text-center text-xs text-[#4a5e3a] leading-relaxed">
              Bisa scan pakai GoPay, OVO, ShopeePay, DANA, atau m-banking apapun.
            </p>

            {/* Polling indicator */}
            <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-2 border-[#1d2b1f] bg-[#faf3e8] py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-md bg-[#BFFF5E] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-md bg-[#BFFF5E]" />
              </span>
              <p className="text-xs text-[#4a5e3a]">Menunggu konfirmasi pembayaran...</p>
            </div>
          </div>
        )}

        {/* PAID */}
        {status === 'paid' && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-md border border-green-500/30 bg-green-500/15">
              <span className="text-4xl">✅</span>
              <span className="absolute inset-0 rounded-md animate-ping bg-green-500/10" style={{ animationDuration: '1.5s', animationIterationCount: 2 }} />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">Pembayaran Berhasil!</p>
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
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10">
              <span className="text-3xl">⏰</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-500">Waktu Habis</p>
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
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-red-500/20 bg-red-500/10">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-500">Gagal Memproses</p>
              <p className="mt-1 text-sm text-[#4a5e3a]">{error}</p>
            </div>
            <Button fullWidth onClick={handleCreate}>Coba Lagi</Button>
          </div>
        )}

      </div>
    </Modal>
  );
}

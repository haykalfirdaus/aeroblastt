import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createBetaOrder, pollBetaOrderStatus } from '@/utils/betaPayment';
import { formatRupiah } from '@/utils/currency';
import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const POLL_INTERVAL = 5000;  // cek status tiap 5 detik
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
    <span className={cn('font-mono font-bold', isUrgent ? 'text-red-400' : 'text-cyan-400')}>
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
      // Stop polling jika sudah expired
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
    <Modal open={open} onClose={handleClose} title="Bayar via QRIS Otomatis" badge="BETA" size="sm">
      <div className="mt-4 flex flex-col gap-4">

        {/* IDLE — belum generate order */}
        {status === 'idle' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Sistem akan generate nominal unik untuk order <span className="font-semibold text-text-bright">{productLabel}</span>.
              Scan QRIS dan bayar <span className="font-semibold text-cyan-400">tepat sesuai nominal</span> yang diberikan — lebih/kurang tidak terdeteksi otomatis.
            </p>
            <p className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-3 py-2 text-xs text-yellow-300">
              ⚠️ Fitur ini masih dalam tahap beta. Pastikan bayar tepat nominal yang ditampilkan.
            </p>
            <Button fullWidth onClick={handleCreate}>Generate Nominal & Tampilkan QRIS</Button>
          </div>
        )}

        {/* LOADING */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-500 border-t-transparent" />
            <p className="text-sm text-text-muted">Membuat order...</p>
          </div>
        )}

        {/* WAITING — tampilkan QRIS + nominal */}
        {status === 'waiting' && order && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-text-muted">Bayar TEPAT sebesar</p>
              <p className="text-2xl font-bold text-cyan-400">{formatRupiah(order.totalAmount)}</p>
              <p className="text-xs text-text-dim">
                Berlaku: <CountdownTimer expiresAt={order.expiresAt} />
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white p-3">
              <img src={QRIS_IMG} alt="QRIS AeroBlast" className="h-52 w-52 object-contain" />
            </div>

            <p className="text-center text-xs text-text-dim">
              Scan dengan GoPay, OVO, ShopeePay, DANA, atau app banking apapun.<br />
              Rank akan masuk otomatis setelah pembayaran terdeteksi.
            </p>

            <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              <p className="text-xs text-text-muted">Menunggu pembayaran...</p>
            </div>
          </div>
        )}

        {/* PAID — sukses */}
        {status === 'paid' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <span className="text-3xl">✅</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">Pembayaran Berhasil!</p>
              <p className="mt-1 text-sm text-text-muted">
                {productLabel} sedang diproses ke akun MC kamu.<br />
                Masuk ke server dalam beberapa detik.
              </p>
            </div>
            <Button fullWidth variant="ghost" onClick={handleClose}>Tutup</Button>
          </div>
        )}

        {/* EXPIRED */}
        {status === 'expired' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-3xl">⏰</span>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">Order Expired</p>
              <p className="mt-1 text-sm text-text-muted">
                Waktu pembayaran habis. Order otomatis dibatalkan.
              </p>
            </div>
            <Button fullWidth onClick={handleCreate}>Coba Lagi</Button>
          </div>
        )}

        {/* FAILED */}
        {status === 'failed' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">Gagal Membuat Order</p>
              <p className="mt-1 text-sm text-text-dim">{error}</p>
            </div>
            <Button fullWidth onClick={handleCreate}>Coba Lagi</Button>
          </div>
        )}

      </div>
    </Modal>
  );
}

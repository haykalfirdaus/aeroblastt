'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Sparkles, QrCode, AlertTriangle, CheckCircle, Clock, Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField, TextareaField } from '@/components/ui/FormFields';
import { formatRupiah } from '@/utils/currency';
import { QrisDisplay } from './QrisDisplay';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];
const POLL_INTERVAL = 5000; // ms

function useCountdownSec(expiresAt) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    function tick() {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setSecs(diff);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return { secs, label: `${m}:${s}` };
}

// Step: 'form' | 'qris' | 'paid' | 'expired'
export function DonateTab() {
  const [step, setStep] = useState('form');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const { nick: playerNick } = usePlayerAuth();
  const [donorNick, setDonorNick] = useState('');

  // Isi otomatis begitu sesi player selesai diverifikasi.
  useEffect(() => {
    if (playerNick) setDonorNick(playerNick);
  }, [playerNick]);
  const [message, setMessage] = useState('');

  // Order state
  const [order, setOrder] = useState(null); // { orderId, totalAmount, expiresAt, suffix }
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);

  const numAmount = Number(String(amount).replace(/\D/g, ''));
  const isValid = numAmount >= 1000;

  const { secs: expSecs, label: expLabel } = useCountdownSec(order?.expiresAt);

  // ── Polling ──────────────────────────────────────────────────────────────────
  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    if (step !== 'qris' || !order?.orderId) return;

    async function check() {
      try {
        const res = await fetch(`/api/beta-payment?action=status&orderId=${order.orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'paid') { stopPoll(); setStep('paid'); }
        else if (data.status === 'expired') { stopPoll(); setStep('expired'); }
      } catch { /* ignore */ }
    }

    check();
    pollRef.current = setInterval(check, POLL_INTERVAL);
    return stopPoll;
  }, [step, order?.orderId, stopPoll]);

  // Auto-expire jika countdown habis dan belum dapat notif paid
  useEffect(() => {
    if (step === 'qris' && expSecs === 0 && order) {
      stopPoll();
      setStep('expired');
    }
  }, [step, expSecs, order, stopPoll]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleAmountInput(e) {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  }

  function handleCopyAmount() {
    navigator.clipboard.writeText(String(order.totalAmount)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }

  async function handleFormSubmit() {
    if (!isValid) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/beta-payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'donate',
          baseAmount: numAmount,
          details: {
            name: name.trim() || 'Anonim',
            nick: (playerNick || donorNick).trim() || null,
            message: message.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) { setCreateError(data.error || 'Gagal membuat order'); return; }
      setOrder({ orderId: data.orderId, totalAmount: data.totalAmount, suffix: data.suffix, expiresAt: data.expiresAt });
      setStep('qris');
    } catch { setCreateError('Koneksi bermasalah, coba lagi'); }
    finally { setCreating(false); }
  }

  function handleReset() {
    stopPoll();
    setAmount('');
    setName('');
    setMessage('');
    setOrder(null);
    setCreateError('');
    setCopied(false);
    setStep('form');
  }

  // ── Paid screen ───────────────────────────────────────────────────────────────
  if (step === 'paid') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-6 py-16 text-center shadow-[var(--neu-out-lg)]"
        data-aos="fade-up" data-aos-duration="400"
      >
        <div className="neu-icon h-16 w-16 rounded-full">
          <CheckCircle size={30} aria-hidden="true" className="text-[#1d2b1f]" />
        </div>
        <div>
          <h3 className="font-display text-xl font-extrabold text-[#1d2b1f]">Donasi Diterima!</h3>
          <p className="mt-1.5 text-sm text-[#4a5e3a]">
            Transfer <span className="font-bold text-[#1d2b1f]">{formatRupiah(order?.totalAmount ?? 0)}</span> sudah masuk.
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-[#4a5e3a]">
            Terima kasih telah mendukung AeroBlast Network!
            <Heart size={14} aria-hidden="true" className="fill-[#5a9e10] text-[#5a9e10]" />
          </p>
          {name.trim() && (
            <p className="mt-1 text-xs text-[#5a7048]">— {name.trim()}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="neu-press min-h-[48px] rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 text-xs font-semibold text-[#4a5e3a] shadow-[var(--neu-out)]"
        >
          Donasi Lagi
        </button>
      </div>
    );
  }

  // ── Expired screen ────────────────────────────────────────────────────────────
  if (step === 'expired') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-6 py-14 text-center shadow-[var(--neu-out-lg)]"
        data-aos="fade-up" data-aos-duration="400"
      >
        <div className="neu-icon h-14 w-14 rounded-full">
          <Clock size={24} aria-hidden="true" className="text-[#4a5e3a]" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-[#1d2b1f]">Order Kedaluwarsa</h3>
          <p className="mt-1.5 text-sm text-[#4a5e3a]">
            Waktu 30 menit habis — transfer tidak terdeteksi.<br />
            Kalau sudah transfer, hubungi Admin.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="neu-press inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 text-xs font-semibold text-[#4a5e3a] shadow-[var(--neu-out)]"
        >
          <RefreshCw size={12} aria-hidden="true" />
          Coba Lagi
        </button>
      </div>
    );
  }

  // ── QRIS screen ───────────────────────────────────────────────────────────────
  if (step === 'qris' && order) {
    const expPct = Math.max(0, (expSecs / (30 * 60)) * 100);
    const expUrgent = expSecs < 5 * 60; // < 5 menit

    return (
      <div
        className="mx-auto max-w-sm"
        data-aos="fade-up" data-aos-duration="400"
      >
        {/* Header */}
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <div className="neu-icon h-12 w-12 rounded-full">
            <QrCode size={22} aria-hidden="true" className="text-[#1d2b1f]" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[#1d2b1f]">Scan QRIS</h3>
            <p className="text-xs text-[#4a5e3a]">Bayar dengan e-wallet atau mobile banking apapun</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-5 shadow-[var(--neu-out-lg)]">
          {/* Countdown bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] text-[#4a5e3a]">
                <Clock size={11} aria-hidden="true" />
                Berlaku selama
              </span>
              <span className={cn('font-mono text-xs font-bold', expUrgent ? 'text-danger' : 'text-[#1d2b1f]')}>{expLabel}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#fff8f0] shadow-[var(--neu-in)]">
              <div
                className={cn('h-full rounded-full transition-all duration-1000', expUrgent ? 'bg-danger' : 'bg-[#8fc93a]')}
                style={{ width: `${expPct}%` }}
              />
            </div>
          </div>

          {/* ⚠️ Nominal warning — ini bagian paling penting */}
          <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 shadow-[var(--neu-in)]">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-amber-800">Transfer TEPAT nominal ini!</p>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  Sistem deteksi otomatis berdasarkan jumlah transfer. Salah 1 rupiah pun tidak akan terdeteksi.
                </p>
              </div>
            </div>
            {/* Nominal besar + tombol copy */}
            <div className="mt-3 flex items-center justify-between gap-2 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-3 py-2 shadow-[var(--neu-out)]">
              <span className="font-mono text-lg font-extrabold text-[#1d2b1f]">
                {formatRupiah(order.totalAmount)}
              </span>
              <button
                type="button"
                onClick={handleCopyAmount}
                className="neu-press flex min-h-[48px] items-center gap-1 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-3 text-[11px] font-semibold text-[#4a5e3a] shadow-[var(--neu-out)]"
              >
                {copied ? <Check size={11} aria-hidden="true" className="text-[#1d2b1f]" /> : <Copy size={11} aria-hidden="true" />}
                {copied ? 'Disalin!' : 'Salin'}
              </button>
            </div>
            {order.suffix > 0 && (
              <p className="mt-1.5 text-[10px] text-amber-600">
                Angka unik +{order.suffix} ditambahkan agar transfer kamu teridentifikasi otomatis.
              </p>
            )}
          </div>

          {/* QRIS dinamis — nominal sudah tertanam, bisa di-download */}
          <QrisDisplay payload={order.qris} amount={order.totalAmount} label="Donasi" />

          {/* Cara bayar */}
          <ol className="flex flex-col gap-1.5 text-xs text-[#4a5e3a]">
            {[
              'Buka aplikasi e-wallet / bank kamu',
              'Scan kode QRIS di atas',
              `Transfer TEPAT ${formatRupiah(order.totalAmount)}`,
              'Konfirmasi — deteksi otomatis dalam beberapa detik',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff8f0] text-[0.6rem] font-bold text-[#1d2b1f] shadow-[var(--neu-in)]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          {/* Status: menunggu */}
          <div className="flex items-center justify-center gap-2 rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 py-2.5 shadow-[var(--neu-in)]">
            <span aria-hidden="true" className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#5a9e10]" />
            <span className="text-xs text-[#4a5e3a]">Menunggu pembayaran...</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="min-h-[48px] text-center text-[11px] font-semibold text-[#4a5e3a] transition-colors hover:text-[#1d2b1f]"
          >
            ← Batalkan & kembali
          </button>
        </div>
      </div>
    );
  }

  // ── Form screen ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg" data-aos="fade-up" data-aos-duration="400">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="neu-icon h-12 w-12 rounded-full">
          <Heart size={22} aria-hidden="true" className="text-[#1d2b1f]" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-[#1d2b1f]">Dukung AeroBlast</h3>
          <p className="text-xs text-[#4a5e3a]">Donasi bebas via QRIS — deteksi otomatis, Discord announce saat masuk</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-5 shadow-[var(--neu-out-lg)]">
        {/* Nominal cepat */}
        <div>
          <p className="mb-2 text-xs font-semibold text-[#4a5e3a]">Pilih nominal</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(String(val))}
                aria-pressed={numAmount === val}
                className={cn(
                  'min-h-[48px] rounded-[var(--radius-neu)] px-4 text-xs font-bold text-[#1d2b1f]',
                  'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                  numAmount === val
                    ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                    : 'neu-press bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]'
                )}
              >
                {formatRupiah(val)}
              </button>
            ))}
          </div>
        </div>

        {/* Input manual */}
        <div>
          <label htmlFor="donate-amount" className="mb-1.5 block text-xs font-semibold text-[#4a5e3a]">
            Atau ketik nominal <span className="text-[#5a7048] font-normal">(min. Rp 1.000)</span>
          </label>
          <div className="relative">
            <span aria-hidden="true" className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xs font-bold text-[#4a5e3a]">Rp</span>
            <TextField
              id="donate-amount"
              type="text"
              inputMode="numeric"
              value={amount ? Number(amount).toLocaleString('id-ID') : ''}
              onChange={handleAmountInput}
              placeholder="0"
              className="pl-10 font-mono"
            />
          </div>
          {amount && !isValid && (
            <p className="mt-1 text-[11px] text-danger">Nominal minimal Rp 1.000</p>
          )}
        </div>

        {/* Nama */}
        <div>
          <label htmlFor="donate-name" className="mb-1.5 block text-xs font-semibold text-[#4a5e3a]">
            Nama <span className="text-[#5a7048] font-normal">(opsional)</span>
          </label>
          <TextField
            id="donate-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonim"
            maxLength={40}
          />
        </div>

        {/* Nick Minecraft — dipakai untuk leaderboard & riwayat di halaman Akun.
            Diisi otomatis kalau sudah login, tapi tetap bisa diketik manual. */}
        <div>
          <label htmlFor="donate-nick" className="mb-1.5 block text-xs font-semibold text-[#4a5e3a]">
            Username Minecraft <span className="text-[#5a7048] font-normal">(opsional)</span>
          </label>
          <TextField
            id="donate-nick"
            type="text"
            value={donorNick}
            onChange={(e) => setDonorNick(e.target.value)}
            placeholder={playerNick ? '' : 'Kosongkan untuk donasi anonim'}
            maxLength={36}
            readOnly={!!playerNick}
          />
          <p className="mt-1 text-[11px] text-[#5a7048]">
            {playerNick
              ? 'Terisi otomatis dari akun yang sedang login.'
              : 'Isi agar donasi masuk ke leaderboard dan riwayat akun kamu.'}
          </p>
        </div>

        {/* Pesan */}
        <div>
          <label htmlFor="donate-message" className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#4a5e3a]">
            <span>Pesan <span className="text-[#5a7048] font-normal">(opsional)</span></span>
            <span className="font-normal text-[#5a7048]">{message.length}/200</span>
          </label>
          <TextareaField
            id="donate-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesanmu untuk tim AeroBlast..."
            maxLength={200}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Preview */}
        {isValid && (
          <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 shadow-[var(--neu-in)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={11} aria-hidden="true" className="text-[#1d2b1f]" />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#1d2b1f]">Ringkasan</span>
            </div>
            <p className="text-xs text-[#4a5e3a]">
              <span className="font-bold text-[#1d2b1f]">{formatRupiah(numAmount)}</span>
              {' '}dari <span className="font-semibold">{name.trim() || 'Anonim'}</span>
            </p>
            {message.trim() && (
              <p className="mt-1 text-[11px] italic text-[#4a5e3a]">"{message.trim()}"</p>
            )}
            <p className="mt-2 text-[10px] text-[#5a7048]">
              * Nominal transfer akan berbeda sedikit (angka unik) agar terdeteksi otomatis
            </p>
          </div>
        )}

        {createError && (
          <p className="rounded-[var(--radius-neu)] bg-[#fff8f0] px-3 py-2 text-xs font-semibold text-danger shadow-[var(--neu-in)]">{createError}</p>
        )}

        <Button fullWidth size="sm" onClick={handleFormSubmit} disabled={!isValid || creating}>
          <QrCode size={13} aria-hidden="true" />
          {creating ? 'Membuat order...' : isValid ? `Lanjut ke QRIS — ${formatRupiah(numAmount)}` : 'Masukkan nominal dulu'}
        </Button>

        <p className="text-center text-[10px] text-[#5a7048]">
          Donasi via QRIS · Deteksi otomatis · Discord announce saat dana masuk
        </p>
      </div>
    </div>
  );
}

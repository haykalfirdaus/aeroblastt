'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart, Sparkles, QrCode, AlertTriangle, CheckCircle,
  Clock, Copy, Check, RefreshCw, Trophy, Crown, ShoppingBag,
  LogIn, PartyPopper, Medal,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { TextField, TextareaField } from '@/components/ui/FormFields';
import { formatRupiah } from '@/utils/currency';
import { QrisDisplay } from '@/components/store/QrisDisplay';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#BFFF5E', '#84cc16', '#4a5e3a', '#f59e0b', '#f472b6', '#60a5fa', '#fbbf24'];

function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 300,
      vx: (Math.random() - 0.5) * 5,
      vy: 2 + Math.random() * 4,
      w: 6 + Math.random() * 10,
      h: 4 + Math.random() * 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      opacity: 1,
    }));

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.angle += p.spin;
        if (frame > 90) p.opacity = Math.max(0, p.opacity - 0.01);
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (particles.some((p) => p.opacity > 0)) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[200]" aria-hidden="true" />;
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdownSec(expiresAt) {
  const [secs, setSecs] = useState(() =>
    expiresAt ? Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)) : 0
  );
  useEffect(() => {
    if (!expiresAt) return;
    function tick() { setSecs(Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))); }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return {
    secs,
    label: `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`,
  };
}

// ── Data hooks ────────────────────────────────────────────────────────────────
function useRecentDonations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/donations');
      const json = await res.json();
      if (json.ok) setData(json.donations);
    } catch { } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, refresh: fetch_ };
}

function useLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/donations?mode=leaderboard');
      const json = await res.json();
      if (json.ok) setData(json.leaderboard);
    } catch { } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);
  return { data, loading, refresh: fetch_ };
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];
const POLL_INTERVAL = 5000;
// Warna medali emas / perak / perunggu — dirender lewat ikon Medal, bukan emoji.
const MEDAL = ['#d4a017', '#8f9298', '#b06a35'];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DonatePage() {
  const { nick: loggedNick, loading: authLoading } = usePlayerAuth();

  const [step, setStep] = useState('form');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lbTab, setLbTab] = useState('leaderboard'); // 'leaderboard' | 'recent'

  const pollRef = useRef(null);
  const { data: recent, loading: recentLoading, refresh: refreshRecent } = useRecentDonations();
  const { data: leaderboard, loading: lbLoading, refresh: refreshLb } = useLeaderboard();

  const numAmount = Number(String(amount).replace(/\D/g, ''));
  const isValid = numAmount >= 1000;
  const willAppearOnLeaderboard = !!loggedNick;
  const { secs: expSecs, label: expLabel } = useCountdownSec(order?.expiresAt);

  // ── Polling ──────────────────────────────────────────────────────────────
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
        if (data.status === 'paid') {
          stopPoll();
          setShowConfetti(true);
          setStep('paid');
          refreshRecent();
          refreshLb();
          setTimeout(() => setShowConfetti(false), 6000);
        } else if (data.status === 'expired') {
          stopPoll(); setStep('expired');
        }
      } catch { }
    }
    check();
    pollRef.current = setInterval(check, POLL_INTERVAL);
    return stopPoll;
  }, [step, order?.orderId, stopPoll, refreshRecent, refreshLb]);

  useEffect(() => {
    if (step === 'qris' && expSecs === 0 && order && new Date(order.expiresAt) <= new Date()) {
      stopPoll(); setStep('expired');
    }
  }, [step, expSecs, order, stopPoll]);

  function handleAmountInput(e) { setAmount(e.target.value.replace(/\D/g, '')); }

  function handleCopyAmount() {
    navigator.clipboard.writeText(String(order.totalAmount)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }

  async function handleFormSubmit() {
    if (!isValid) return;
    setCreating(true); setCreateError('');
    try {
      const res = await fetch('/api/beta-payment?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'donate',
          baseAmount: numAmount,
          details: {
            name: loggedNick || name.trim() || 'Anonim',
            nick: loggedNick || null,   // null = anonim, tidak masuk leaderboard
            message: message.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) { setCreateError(data.error || 'Gagal membuat order'); return; }
      // `qris` wajib ikut disalin — tanpa itu QrisDisplay fallback ke QR statis.
      setOrder({ orderId: data.orderId, totalAmount: data.totalAmount, suffix: data.suffix, expiresAt: data.expiresAt, qris: data.qris });
      setStep('qris');
    } catch (err) { setCreateError(`Koneksi bermasalah: ${err?.message || err}`); }
    finally { setCreating(false); }
  }

  function handleReset() {
    stopPoll(); setAmount(''); setName(''); setMessage('');
    setOrder(null); setCreateError(''); setCopied(false); setStep('form');
  }

  const expPct = Math.max(0, (expSecs / (30 * 60)) * 100);
  const expUrgent = expSecs < 5 * 60;

  return (
    <PageLayout>
      <ConfettiCanvas active={showConfetti} />

      {/* Header */}
      <div className="relative bg-[#fff8f0] px-4 py-10 text-center shadow-[var(--neu-in)] sm:px-6 lg:px-8">
        <span data-aos="fade-down" data-aos-duration="600" className="neu-chip relative mb-3 text-[0.65rem] text-[#4a5e3a]">
          <Heart size={10} aria-hidden="true" className="fill-[#4a5e3a]" />Dukung Server
        </span>
        <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="700" className="relative font-display text-2xl font-extrabold text-[#1d2b1f] sm:text-3xl">
          Donasi untuk AeroBlast
        </h1>
        <p data-aos="fade-up" data-aos-delay="200" data-aos-duration="700" className="relative mt-1.5 flex items-center justify-center gap-1.5 text-xs text-[#4a5e3a]">
          Bantu server tetap berjalan &amp; masuk leaderboard donatur!
          <Heart size={12} aria-hidden="true" className="fill-[#3d7208] text-[#3d7208]" />
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">

          {/* ── Kiri: Form / QRIS / Status ────────────────────────────────── */}
          <div>

            {/* PAID */}
            {step === 'paid' && (
              <div className="flex flex-col items-center justify-center gap-6 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-6 py-16 text-center shadow-[var(--neu-out-lg)]"
                style={{ animation: 'page-wipe-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
                <div className="neu-icon h-20 w-20 rounded-full">
                  <CheckCircle size={38} aria-hidden="true" className="text-[#1d2b1f]" />
                </div>
                <div>
                  <h2 className="flex items-center justify-center gap-2 font-display text-2xl font-extrabold text-[#1d2b1f]">
                    Donasi Diterima!
                    <PartyPopper size={22} aria-hidden="true" className="text-[#3d7208]" />
                  </h2>
                  <p className="mt-2 text-sm text-[#4a5e3a]">
                    Transfer <span className="font-bold text-[#1d2b1f]">{formatRupiah(order?.totalAmount ?? 0)}</span> sudah masuk.
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-[#4a5e3a]">
                    Terima kasih telah mendukung AeroBlast Network!
                    <Heart size={14} aria-hidden="true" className="fill-[#3d7208] text-[#3d7208]" />
                  </p>
                  {loggedNick && (
                    <p className="mt-3 rounded-[var(--radius-neu)] bg-[#fff8f0] px-3 py-2 text-xs text-[#1d2b1f] shadow-[var(--neu-in)]">
                      Donasi atas nama <span className="font-bold">{loggedNick}</span> sudah masuk leaderboard!
                    </p>
                  )}
                </div>
                <button type="button" onClick={handleReset}
                  className="neu-press min-h-[48px] rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,#d4ff80,#a8f040)] px-6 text-sm font-bold text-[#22331a] shadow-[var(--neu-out)]">
                  Donasi Lagi
                </button>
              </div>
            )}

            {/* EXPIRED */}
            {step === 'expired' && (
              <div className="flex flex-col items-center justify-center gap-5 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-6 py-14 text-center shadow-[var(--neu-out-lg)]"
                style={{ animation: 'page-wipe-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
                <div className="neu-icon h-14 w-14 rounded-full">
                  <Clock size={24} aria-hidden="true" className="text-[#4a5e3a]" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#1d2b1f]">Order Kedaluwarsa</h3>
                  <p className="mt-1.5 text-sm text-[#4a5e3a]">Waktu 30 menit habis. Kalau sudah transfer, hubungi Admin.</p>
                </div>
                <button type="button" onClick={handleReset}
                  className="neu-press inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 text-xs font-semibold text-[#4a5e3a] shadow-[var(--neu-out)]">
                  <RefreshCw size={12} aria-hidden="true" />Coba Lagi
                </button>
              </div>
            )}

            {/* QRIS */}
            {step === 'qris' && order && (
              <div style={{ animation: 'page-wipe-in 0.28s cubic-bezier(0.22,1,0.36,1) both' }}>
                <div className="mb-5 flex flex-col items-center gap-2 text-center">
                  <div className="neu-icon h-12 w-12 rounded-full">
                    <QrCode size={22} aria-hidden="true" className="text-[#1d2b1f]" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#1d2b1f]">Scan QRIS</h2>
                  <p className="text-xs text-[#4a5e3a]">Bayar dengan e-wallet atau mobile banking apapun</p>
                </div>

                <div className="flex flex-col gap-4 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-5 shadow-[var(--neu-out-lg)]">
                  {/* Countdown bar */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-[#4a5e3a]"><Clock size={11} aria-hidden="true" />Berlaku selama</span>
                      <span className={cn('font-mono text-xs font-bold', expUrgent ? 'text-danger' : 'text-[#1d2b1f]')}>{expLabel}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#fff8f0] shadow-[var(--neu-in)]">
                      <div className={cn('h-full rounded-full transition-all duration-1000', expUrgent ? 'bg-danger' : 'bg-[#8fc93a]')} style={{ width: `${expPct}%` }} />
                    </div>
                  </div>

                  {/* Warning nominal */}
                  <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 shadow-[var(--neu-in)]">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">Transfer TEPAT nominal ini!</p>
                        <p className="mt-0.5 text-[11px] text-amber-700">Sistem deteksi otomatis. Salah 1 rupiah pun tidak akan terdeteksi.</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-3 py-2 shadow-[var(--neu-out)]">
                      <span className="font-mono text-xl font-extrabold text-[#1d2b1f]">{formatRupiah(order.totalAmount)}</span>
                      <button type="button" onClick={handleCopyAmount}
                        className="neu-press flex min-h-[48px] items-center gap-1 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-3 text-[11px] font-semibold text-[#4a5e3a] shadow-[var(--neu-out)]">
                        {copied ? <Check size={11} aria-hidden="true" className="text-[#1d2b1f]" /> : <Copy size={11} aria-hidden="true" />}
                        {copied ? 'Disalin!' : 'Salin'}
                      </button>
                    </div>
                    {order.suffix > 0 && (
                      <p className="mt-1.5 text-[10px] text-amber-600">Angka unik +{order.suffix} ditambahkan agar transfermu teridentifikasi otomatis.</p>
                    )}
                  </div>

                  {/* QR dinamis — nominal sudah tertanam, bisa di-download */}
                  <QrisDisplay payload={order.qris} amount={order.totalAmount} label="Donasi" />

                  <ol className="flex flex-col gap-1.5 text-xs text-[#4a5e3a]">
                    {['Buka aplikasi e-wallet / bank kamu', 'Scan kode QRIS di atas', `Transfer TEPAT ${formatRupiah(order.totalAmount)}`, 'Konfirmasi — deteksi otomatis dalam beberapa detik'].map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff8f0] text-[0.6rem] font-bold text-[#1d2b1f] shadow-[var(--neu-in)]">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>

                  <div className="flex items-center justify-center gap-2 rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 py-2.5 shadow-[var(--neu-in)]">
                    <span aria-hidden="true" className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#3d7208]" />
                    <span className="text-xs text-[#4a5e3a]">Menunggu pembayaran...</span>
                  </div>

                  <button type="button" onClick={handleReset} className="min-h-[48px] text-center text-[11px] font-semibold text-[#4a5e3a] transition-colors hover:text-[#1d2b1f]">
                    ← Batalkan &amp; kembali
                  </button>
                </div>
              </div>
            )}

            {/* FORM */}
            {step === 'form' && (
              <div style={{ animation: 'page-wipe-in 0.28s cubic-bezier(0.22,1,0.36,1) both' }}>
                {/* Login state banner */}
                {!authLoading && (
                  loggedNick ? (
                    <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 shadow-[var(--neu-in)]">
                      <div className="neu-icon h-9 w-9 rounded-full">
                        <Trophy size={14} aria-hidden="true" className="text-[#1d2b1f]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1d2b1f]">Login sebagai <span className="text-[#1d2b1f]">{loggedNick}</span></p>
                        <p className="text-[11px] text-[#4a5e3a]">Donasimu akan masuk leaderboard!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 shadow-[var(--neu-in)]">
                      <div className="neu-icon h-9 w-9 rounded-full">
                        <LogIn size={14} aria-hidden="true" className="text-[#4a5e3a]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1d2b1f]">Belum login</p>
                        <p className="text-[11px] text-[#4a5e3a]">
                          Donasi anonim tidak masuk leaderboard.{' '}
                          <Link href="/store" className="font-semibold text-[#1d2b1f] underline-offset-2 hover:underline">
                            Login di Store
                          </Link>{' '}
                          dulu untuk tampil di papan donatur.
                        </p>
                      </div>
                    </div>
                  )
                )}

                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                  <div className="neu-icon h-14 w-14 rounded-full">
                    <Heart size={26} aria-hidden="true" className="text-[#1d2b1f]" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#1d2b1f]">Pilih Nominal Donasi</h2>
                  <p className="text-xs text-[#4a5e3a]">Donasi via QRIS · Deteksi otomatis · Discord announce saat dana masuk</p>
                </div>

                <div className="flex flex-col gap-4 rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-5 shadow-[var(--neu-out-lg)]">
                  {/* Quick amounts */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#4a5e3a]">Pilih nominal</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_AMOUNTS.map((val) => (
                        <button key={val} type="button" onClick={() => setAmount(String(val))}
                          aria-pressed={numAmount === val}
                          className={cn('min-h-[48px] rounded-[var(--radius-neu)] px-4 text-xs font-bold text-[#1d2b1f]',
                            'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                            numAmount === val
                              ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                              : 'neu-press bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]'
                          )}>
                          {formatRupiah(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual input */}
                  <div>
                    <label htmlFor="donate-page-amount" className="mb-1.5 block text-xs font-semibold text-[#4a5e3a]">
                      Atau ketik nominal <span className="font-normal text-[#5a7048]">(min. Rp 1.000)</span>
                    </label>
                    <div className="relative">
                      <span aria-hidden="true" className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xs font-bold text-[#4a5e3a]">Rp</span>
                      <TextField id="donate-page-amount" type="text" inputMode="numeric"
                        value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                        onChange={handleAmountInput} placeholder="0"
                        className="pl-10 font-mono" />
                    </div>
                    {amount && !isValid && <p className="mt-1 text-[11px] text-danger">Nominal minimal Rp 1.000</p>}
                  </div>

                  {/* Nama — hanya tampil kalau belum login */}
                  {!loggedNick && (
                    <div>
                      <label htmlFor="donate-page-name" className="mb-1.5 block text-xs font-semibold text-[#4a5e3a]">
                        Nama <span className="font-normal text-[#5a7048]">(opsional — tidak masuk leaderboard)</span>
                      </label>
                      <TextField id="donate-page-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Anonim" maxLength={40} />
                    </div>
                  )}

                  {/* Pesan */}
                  <div>
                    <label htmlFor="donate-page-message" className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#4a5e3a]">
                      <span>Pesan <span className="font-normal text-[#5a7048]">(opsional)</span></span>
                      <span className="font-normal text-[#5a7048]">{message.length}/200</span>
                    </label>
                    <TextareaField id="donate-page-message" value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tulis pesanmu untuk tim AeroBlast..."
                      maxLength={200} rows={3}
                      className="resize-none" />
                  </div>

                  {/* Preview */}
                  {isValid && (
                    <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 shadow-[var(--neu-in)]">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Sparkles size={11} aria-hidden="true" className="text-[#1d2b1f]" />
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#1d2b1f]">Ringkasan</span>
                      </div>
                      <p className="text-xs text-[#4a5e3a]">
                        <span className="font-bold text-[#1d2b1f]">{formatRupiah(numAmount)}</span>
                        {' '}dari <span className="font-semibold">{loggedNick || name.trim() || 'Anonim'}</span>
                      </p>
                      {message.trim() && <p className="mt-1 text-[11px] italic text-[#4a5e3a]">"{message.trim()}"</p>}
                      <p className="mt-2 text-[10px] text-[#5a7048]">
                        * Nominal transfer akan berbeda sedikit (angka unik) agar terdeteksi otomatis
                      </p>
                      {willAppearOnLeaderboard && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#1d2b1f]">
                          <Check size={11} aria-hidden="true" /> Akan masuk leaderboard sebagai {loggedNick}
                        </p>
                      )}
                    </div>
                  )}

                  {createError && (
                    <p className="rounded-[var(--radius-neu)] bg-[#fff8f0] px-3 py-2 text-xs font-semibold text-danger shadow-[var(--neu-in)]">{createError}</p>
                  )}

                  <Button fullWidth size="sm" onClick={handleFormSubmit} disabled={!isValid || creating}>
                    <QrCode size={13} aria-hidden="true" />
                    {creating ? 'Membuat order...' : isValid ? `Lanjut ke QRIS — ${formatRupiah(numAmount)}` : 'Masukkan nominal dulu'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Kanan: Leaderboard + Recent ──────────────────────────────────── */}
          <div>
            <div className="sticky top-24">
              {/* Tab switcher */}
              <div className="mb-4 flex gap-2 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-2 shadow-[var(--neu-in)]">
                <button type="button" onClick={() => setLbTab('leaderboard')}
                  aria-pressed={lbTab === 'leaderboard'}
                  className={cn('flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-neu)] text-xs font-bold text-[#1d2b1f]',
                    'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                    lbTab === 'leaderboard'
                      ? 'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]'
                      : 'text-[#4a5e3a]')}>
                  <Crown size={11} aria-hidden="true" />Leaderboard
                </button>
                <button type="button" onClick={() => setLbTab('recent')}
                  aria-pressed={lbTab === 'recent'}
                  className={cn('flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-neu)] text-xs font-bold text-[#1d2b1f]',
                    'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                    lbTab === 'recent'
                      ? 'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]'
                      : 'text-[#4a5e3a]')}>
                  <Heart size={11} aria-hidden="true" />Terbaru
                </button>
              </div>

              {/* Leaderboard */}
              {lbTab === 'leaderboard' && (
                <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-4 shadow-[var(--neu-out)]">
                  {lbLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <span aria-hidden="true" className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#3d7208]" />
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <Trophy size={28} aria-hidden="true" className="text-[#5a7048]" />
                      <div>
                        <p className="text-xs font-semibold text-[#4a5e3a]">Belum ada donatur terdaftar</p>
                        <p className="mt-0.5 text-[11px] text-[#5a7048]">
                          Login di Store lalu donasi untuk tampil di sini!
                        </p>
                      </div>
                      <Link href="/store"
                        className="neu-press inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 text-xs font-bold text-[#1d2b1f] shadow-[var(--neu-out)]">
                        <ShoppingBag size={11} aria-hidden="true" />Ke Store
                      </Link>
                    </div>
                  ) : (
                    leaderboard.map((entry, i) => (
                      <div key={entry.nick}
                        className={cn('flex items-center gap-3 rounded-[var(--radius-neu)] px-3 py-2.5',
                          i === 0
                            ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                            : 'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]')}>
                        {/* Rank */}
                        <div className="w-7 shrink-0 text-center">
                          {i < 3
                            ? <Medal size={18} aria-label={`Peringkat ${i + 1}`} className="mx-auto" style={{ color: MEDAL[i] }} />
                            : <span className="text-xs font-bold text-[#4a5e3a]">{i + 1}</span>
                          }
                        </div>
                        {/* Nick */}
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate text-xs font-bold', i === 0 ? 'text-[#1d2b1f]' : 'text-[#1d2b1f]')}>{entry.nick}</p>
                          <p className="text-[10px] text-[#4a5e3a]">{entry.count}x donasi</p>
                        </div>
                        {/* Total */}
                        <span className={cn('shrink-0 font-mono text-xs font-extrabold', i === 0 ? 'text-[#1d2b1f]' : 'text-[#4a5e3a]')}>
                          {formatRupiah(entry.total)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Recent donations */}
              {lbTab === 'recent' && (
                <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto rounded-[var(--radius-neu-xl)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] p-4 shadow-[var(--neu-out)]">
                  {recentLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <span aria-hidden="true" className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#3d7208]" />
                    </div>
                  ) : recent.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Heart size={22} aria-hidden="true" className="text-[#5a7048]" />
                      <p className="text-xs text-[#4a5e3a]">Belum ada donasi.<br />Jadilah yang pertama!</p>
                    </div>
                  ) : (
                    recent.map((d, i) => (
                      <div key={d.id}
                        className={cn('flex flex-col gap-1 rounded-[var(--radius-neu)] px-3 py-2.5',
                          i === 0
                            ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                            : 'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]')}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {d.nick
                              ? <span className="truncate text-xs font-semibold text-[#1d2b1f]">{d.nick}</span>
                              : <span className="truncate text-xs text-[#4a5e3a] italic">{d.donor_name}</span>
                            }
                            {!d.nick && <span className="neu-tag shrink-0 text-[9px]">anonim</span>}
                          </div>
                          <span className="shrink-0 font-mono text-xs font-bold text-[#1d2b1f]">{formatRupiah(d.amount)}</span>
                        </div>
                        {d.message && <p className="truncate text-[11px] italic text-[#4a5e3a]">"{d.message}"</p>}
                        <p className="text-[10px] text-[#4a5e3a]">{timeAgo(d.paid_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Total keseluruhan */}
              {recent.length > 0 && (
                <div className="mt-3 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] px-4 py-3 shadow-[var(--neu-in)]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#4a5e3a]">Total donasi terkumpul</p>
                  <p className="font-mono text-base font-extrabold text-[#1d2b1f]">
                    {formatRupiah(recent.reduce((s, d) => s + d.amount, 0))}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#4a5e3a]">
                    dari {recent.length} donasi · Terima kasih!
                    <Heart size={10} aria-hidden="true" className="fill-[#3d7208] text-[#3d7208]" />
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}

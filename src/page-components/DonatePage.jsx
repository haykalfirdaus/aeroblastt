'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart, Sparkles, QrCode, AlertTriangle, CheckCircle,
  Clock, Copy, Check, RefreshCw, Trophy, Crown, ShoppingBag,
  LogIn,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/utils/currency';
import { SITE } from '@/data/config';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#B4E035', '#84cc16', '#6B7F5A', '#f59e0b', '#f472b6', '#60a5fa', '#fbbf24'];

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
const MEDAL = ['🥇', '🥈', '🥉'];

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
      setOrder({ orderId: data.orderId, totalAmount: data.totalAmount, suffix: data.suffix, expiresAt: data.expiresAt });
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
      <div className="relative border-b border-[#D8D1C0] bg-[#EDE8DA] px-4 py-10 text-center sm:px-6 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-[#B4E035]/10 blur-3xl" />
        </div>
        <span data-aos="fade-down" data-aos-duration="600" className="relative mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#B4E035]/35 bg-[#B4E035]/10 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#748F1C]">
          <Heart size={10} className="fill-[#748F1C]" />Dukung Server
        </span>
        <h1 data-aos="fade-up" data-aos-delay="100" data-aos-duration="700" className="relative font-display text-2xl font-extrabold text-[#1A2E1A] sm:text-3xl">
          Donasi untuk AeroBlast
        </h1>
        <p data-aos="fade-up" data-aos-delay="200" data-aos-duration="700" className="relative mt-1.5 text-xs text-[#6B7F5A]">
          Bantu server tetap berjalan &amp; masuk leaderboard donatur! 💚
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">

          {/* ── Kiri: Form / QRIS / Status ────────────────────────────────── */}
          <div>

            {/* PAID */}
            {step === 'paid' && (
              <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-[#B4E035]/30 bg-[#B4E035]/[0.07] px-6 py-16 text-center"
                style={{ animation: 'page-wipe-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#B4E035]/50 bg-[#B4E035]/15">
                  <CheckCircle size={38} className="text-[#748F1C]" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-[#1A2E1A]">Donasi Diterima! 🎉</h2>
                  <p className="mt-2 text-sm text-[#6B7F5A]">
                    Transfer <span className="font-bold text-[#1A2E1A]">{formatRupiah(order?.totalAmount ?? 0)}</span> sudah masuk.
                  </p>
                  <p className="mt-0.5 text-sm text-[#6B7F5A]">Terima kasih telah mendukung AeroBlast Network! 💚</p>
                  {loggedNick && (
                    <p className="mt-2 rounded-lg border border-[#B4E035]/25 bg-[#B4E035]/10 px-3 py-1.5 text-xs text-[#748F1C]">
                      Donasi atas nama <span className="font-bold">{loggedNick}</span> sudah masuk leaderboard!
                    </p>
                  )}
                </div>
                <button type="button" onClick={handleReset}
                  className="rounded-xl border border-[#B4E035]/40 bg-[#B4E035]/15 px-5 py-2.5 text-sm font-semibold text-[#748F1C] transition-all hover:bg-[#B4E035]/25">
                  Donasi Lagi
                </button>
              </div>
            )}

            {/* EXPIRED */}
            {step === 'expired' && (
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7] px-6 py-14 text-center"
                style={{ animation: 'page-wipe-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D8D1C0] bg-[#F0EBE0]">
                  <Clock size={24} className="text-[#8A9E7A]" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#1A2E1A]">Order Kedaluwarsa</h3>
                  <p className="mt-1.5 text-sm text-[#6B7F5A]">Waktu 30 menit habis. Kalau sudah transfer, hubungi Admin.</p>
                </div>
                <button type="button" onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D1C0] bg-[#F0EBE0] px-4 py-2 text-xs font-semibold text-[#6B7F5A] transition-colors hover:text-[#1A2E1A]">
                  <RefreshCw size={12} />Coba Lagi
                </button>
              </div>
            )}

            {/* QRIS */}
            {step === 'qris' && order && (
              <div style={{ animation: 'page-wipe-in 0.28s cubic-bezier(0.22,1,0.36,1) both' }}>
                <div className="mb-5 flex flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#B4E035]/35 bg-[#B4E035]/10">
                    <QrCode size={22} className="text-[#748F1C]" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#1A2E1A]">Scan QRIS</h2>
                  <p className="text-xs text-[#6B7F5A]">Bayar dengan e-wallet atau mobile banking apapun</p>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7] p-5">
                  {/* Countdown bar */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-[#6B7F5A]"><Clock size={11} />Berlaku selama</span>
                      <span className={cn('font-mono text-xs font-bold', expUrgent ? 'text-danger' : 'text-[#1A2E1A]')}>{expLabel}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E6E0D4]">
                      <div className={cn('h-full rounded-full transition-all duration-1000', expUrgent ? 'bg-danger' : 'bg-[#B4E035]')} style={{ width: `${expPct}%` }} />
                    </div>
                  </div>

                  {/* Warning nominal */}
                  <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-amber-800">Transfer TEPAT nominal ini!</p>
                        <p className="mt-0.5 text-[11px] text-amber-700">Sistem deteksi otomatis. Salah 1 rupiah pun tidak akan terdeteksi.</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2">
                      <span className="font-mono text-xl font-extrabold text-[#1A2E1A]">{formatRupiah(order.totalAmount)}</span>
                      <button type="button" onClick={handleCopyAmount}
                        className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 transition-all hover:bg-amber-100">
                        {copied ? <Check size={11} className="text-[#748F1C]" /> : <Copy size={11} />}
                        {copied ? 'Disalin!' : 'Salin'}
                      </button>
                    </div>
                    {order.suffix > 0 && (
                      <p className="mt-1.5 text-[10px] text-amber-600">Angka unik +{order.suffix} ditambahkan agar transfermu teridentifikasi otomatis.</p>
                    )}
                  </div>

                  {/* QR */}
                  <div className="flex justify-center">
                    <div className="overflow-hidden rounded-xl border border-[#D8D1C0] bg-white p-3 shadow-sm">
                      <img src={SITE.payment.QRIS.imgPath} alt="QRIS AeroBlast" width={240} height={240} className="block" />
                    </div>
                  </div>

                  <ol className="flex flex-col gap-1.5 text-xs text-[#6B7F5A]">
                    {['Buka aplikasi e-wallet / bank kamu', 'Scan kode QRIS di atas', `Transfer TEPAT ${formatRupiah(order.totalAmount)}`, 'Konfirmasi — deteksi otomatis dalam beberapa detik'].map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#B4E035]/20 text-[0.6rem] font-bold text-[#748F1C]">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>

                  <div className="flex items-center justify-center gap-2 rounded-lg border border-[#D8D1C0] bg-[#F0EBE0] px-4 py-2.5">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#B4E035]" />
                    <span className="text-xs text-[#6B7F5A]">Menunggu pembayaran...</span>
                  </div>

                  <button type="button" onClick={handleReset} className="text-center text-[11px] text-[#8A9E7A] transition-colors hover:text-[#6B7F5A]">
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
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#B4E035]/30 bg-[#B4E035]/[0.07] px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#B4E035]/40 bg-[#B4E035]/15">
                        <Trophy size={14} className="text-[#748F1C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1A2E1A]">Login sebagai <span className="text-[#748F1C]">{loggedNick}</span></p>
                        <p className="text-[11px] text-[#6B7F5A]">Donasimu akan masuk leaderboard!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#D8D1C0] bg-[#F0EBE0] px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D8D1C0] bg-[#EDE8DA]">
                        <LogIn size={14} className="text-[#8A9E7A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1A2E1A]">Belum login</p>
                        <p className="text-[11px] text-[#6B7F5A]">
                          Donasi anonim tidak masuk leaderboard.{' '}
                          <Link href="/store" className="font-semibold text-[#748F1C] underline-offset-2 hover:underline">
                            Login di Store
                          </Link>{' '}
                          dulu untuk tampil di papan donatur.
                        </p>
                      </div>
                    </div>
                  )
                )}

                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#B4E035]/35 bg-[#B4E035]/10">
                    <Heart size={26} className="text-[#748F1C]" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#1A2E1A]">Pilih Nominal Donasi</h2>
                  <p className="text-xs text-[#6B7F5A]">Donasi via QRIS · Deteksi otomatis · Discord announce saat dana masuk</p>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7] p-5">
                  {/* Quick amounts */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#6B7F5A]">Pilih nominal</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_AMOUNTS.map((val) => (
                        <button key={val} type="button" onClick={() => setAmount(String(val))}
                          className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                            numAmount === val
                              ? 'border-[#B4E035]/50 bg-[#B4E035]/20 text-[#748F1C] ring-1 ring-[#B4E035]/40'
                              : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] hover:border-[#B4E035]/30 hover:text-[#1A2E1A]'
                          )}>
                          {formatRupiah(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual input */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#4A5E3E]">
                      Atau ketik nominal <span className="font-normal text-[#8A9E7A]">(min. Rp 1.000)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A9E7A]">Rp</span>
                      <input type="text" inputMode="numeric"
                        value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                        onChange={handleAmountInput} placeholder="0"
                        className="w-full rounded-xl border border-[#D8D1C0] bg-white py-2.5 pl-9 pr-4 text-sm font-mono font-semibold text-[#1A2E1A] placeholder:text-[#D8D1C0] outline-none transition-colors focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/15" />
                    </div>
                    {amount && !isValid && <p className="mt-1 text-[11px] text-danger">Nominal minimal Rp 1.000</p>}
                  </div>

                  {/* Nama — hanya tampil kalau belum login */}
                  {!loggedNick && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-[#4A5E3E]">
                        Nama <span className="font-normal text-[#8A9E7A]">(opsional — tidak masuk leaderboard)</span>
                      </label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Anonim" maxLength={40}
                        className="w-full rounded-xl border border-[#D8D1C0] bg-white px-4 py-2.5 text-sm text-[#1A2E1A] placeholder:text-[#C8C4B8] outline-none transition-colors focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/15" />
                    </div>
                  )}

                  {/* Pesan */}
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#4A5E3E]">
                      <span>Pesan <span className="font-normal text-[#8A9E7A]">(opsional)</span></span>
                      <span className="font-normal text-[#8A9E7A]">{message.length}/200</span>
                    </label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tulis pesanmu untuk tim AeroBlast..."
                      maxLength={200} rows={3}
                      className="w-full resize-none rounded-xl border border-[#D8D1C0] bg-white px-4 py-2.5 text-sm text-[#1A2E1A] placeholder:text-[#C8C4B8] outline-none transition-colors focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/15" />
                  </div>

                  {/* Preview */}
                  {isValid && (
                    <div className="rounded-xl border border-[#B4E035]/20 bg-[#B4E035]/[0.06] px-4 py-3">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-[#748F1C]" />
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#748F1C]">Ringkasan</span>
                      </div>
                      <p className="text-xs text-[#4A5E3E]">
                        <span className="font-bold text-[#1A2E1A]">{formatRupiah(numAmount)}</span>
                        {' '}dari <span className="font-semibold">{loggedNick || name.trim() || 'Anonim'}</span>
                      </p>
                      {message.trim() && <p className="mt-1 text-[11px] italic text-[#6B7F5A]">"{message.trim()}"</p>}
                      <p className="mt-2 text-[10px] text-[#8A9E7A]">
                        * Nominal transfer akan berbeda sedikit (angka unik) agar terdeteksi otomatis
                      </p>
                      {willAppearOnLeaderboard && (
                        <p className="mt-1 text-[10px] font-semibold text-[#748F1C]">✓ Akan masuk leaderboard sebagai {loggedNick}</p>
                      )}
                    </div>
                  )}

                  {createError && (
                    <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">{createError}</p>
                  )}

                  <Button fullWidth size="sm" onClick={handleFormSubmit} disabled={!isValid || creating}>
                    <QrCode size={13} />
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
              <div className="mb-4 flex rounded-xl border border-[#D8D1C0] bg-[#F0EBE0] p-1 gap-1">
                <button type="button" onClick={() => setLbTab('leaderboard')}
                  className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                    lbTab === 'leaderboard' ? 'bg-white text-[#1A2E1A] shadow-sm' : 'text-[#8A9E7A] hover:text-[#6B7F5A]')}>
                  <Crown size={11} />Leaderboard
                </button>
                <button type="button" onClick={() => setLbTab('recent')}
                  className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                    lbTab === 'recent' ? 'bg-white text-[#1A2E1A] shadow-sm' : 'text-[#8A9E7A] hover:text-[#6B7F5A]')}>
                  <Heart size={11} />Terbaru
                </button>
              </div>

              {/* Leaderboard */}
              {lbTab === 'leaderboard' && (
                <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7] p-4">
                  {lbLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#B4E035]" />
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <Trophy size={28} className="text-[#D8D1C0]" />
                      <div>
                        <p className="text-xs font-semibold text-[#6B7F5A]">Belum ada donatur terdaftar</p>
                        <p className="mt-0.5 text-[11px] text-[#8A9E7A]">
                          Login di Store lalu donasi untuk tampil di sini!
                        </p>
                      </div>
                      <Link href="/store"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#B4E035]/40 bg-[#B4E035]/10 px-3 py-1.5 text-xs font-semibold text-[#748F1C] hover:bg-[#B4E035]/20">
                        <ShoppingBag size={11} />Ke Store
                      </Link>
                    </div>
                  ) : (
                    leaderboard.map((entry, i) => (
                      <div key={entry.nick}
                        className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all',
                          i === 0 ? 'border-[#B4E035]/40 bg-[#B4E035]/[0.08]'
                            : i === 1 ? 'border-[#D8D1C0] bg-[#F5F4EE]'
                              : i === 2 ? 'border-[#D8D1C0] bg-[#FAFAF7]'
                                : 'border-[#D8D1C0]/60 bg-white')}>
                        {/* Rank */}
                        <div className="w-7 shrink-0 text-center">
                          {i < 3
                            ? <span className="text-lg leading-none">{MEDAL[i]}</span>
                            : <span className="text-xs font-bold text-[#8A9E7A]">{i + 1}</span>
                          }
                        </div>
                        {/* Nick */}
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate text-xs font-bold', i === 0 ? 'text-[#748F1C]' : 'text-[#1A2E1A]')}>{entry.nick}</p>
                          <p className="text-[10px] text-[#8A9E7A]">{entry.count}x donasi</p>
                        </div>
                        {/* Total */}
                        <span className={cn('shrink-0 font-mono text-xs font-extrabold', i === 0 ? 'text-[#748F1C]' : 'text-[#4A5E3E]')}>
                          {formatRupiah(entry.total)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Recent donations */}
              {lbTab === 'recent' && (
                <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7] p-4">
                  {recentLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#B4E035]" />
                    </div>
                  ) : recent.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Heart size={22} className="text-[#D8D1C0]" />
                      <p className="text-xs text-[#8A9E7A]">Belum ada donasi.<br />Jadilah yang pertama! 💚</p>
                    </div>
                  ) : (
                    recent.map((d, i) => (
                      <div key={d.id}
                        className={cn('flex flex-col gap-1 rounded-xl border px-3 py-2.5',
                          i === 0 ? 'border-[#B4E035]/30 bg-[#B4E035]/[0.07]' : 'border-[#D8D1C0] bg-white')}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {d.nick
                              ? <span className="truncate text-xs font-semibold text-[#1A2E1A]">{d.nick}</span>
                              : <span className="truncate text-xs text-[#8A9E7A] italic">{d.donor_name}</span>
                            }
                            {!d.nick && <span className="shrink-0 rounded-full border border-[#D8D1C0] px-1.5 py-0.5 text-[9px] text-[#8A9E7A]">anonim</span>}
                          </div>
                          <span className="shrink-0 font-mono text-xs font-bold text-[#748F1C]">{formatRupiah(d.amount)}</span>
                        </div>
                        {d.message && <p className="truncate text-[11px] italic text-[#6B7F5A]">"{d.message}"</p>}
                        <p className="text-[10px] text-[#8A9E7A]">{timeAgo(d.paid_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Total keseluruhan */}
              {recent.length > 0 && (
                <div className="mt-3 rounded-xl border border-[#B4E035]/20 bg-[#B4E035]/[0.06] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A9E7A]">Total donasi terkumpul</p>
                  <p className="font-mono text-base font-extrabold text-[#1A2E1A]">
                    {formatRupiah(recent.reduce((s, d) => s + d.amount, 0))}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#8A9E7A]">dari {recent.length} donasi · Terima kasih! 💚</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}

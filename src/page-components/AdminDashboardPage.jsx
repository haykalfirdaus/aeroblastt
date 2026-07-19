'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  LogOut,
  Megaphone,
  PercentCircle,
  Plus,
  Shield,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const fieldBase =
  'w-full rounded-xl border border-[#D8D1C0] bg-[#FAFAF7] px-4 py-3 text-sm text-[#1A2E1A] placeholder:text-[#8A9E7A] outline-none transition-colors focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/20 focus:bg-[#F5F2EA] disabled:cursor-not-allowed disabled:opacity-50';

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4A5E3E]">
      {children}
      {required && <span className="text-[#748F1C]"> *</span>}
    </label>
  );
}

function SectionCard({ icon: Icon, title, accent = 'neon-400', badge, children }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, #B4E035, transparent)`,
        }}
      />
      <div className="flex items-center gap-3 border-b border-[#D8D1C0] px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8D1C0] bg-[#F0EBE0] text-[#748F1C]">
          <Icon size={18} />
        </div>
        <h2 className="font-display text-base font-semibold text-[#1A2E1A]">{title}</h2>
        {badge !== undefined && (
          <span className="ml-auto rounded-full border border-[#D8D1C0] bg-[#F0EBE0] px-2.5 py-0.5 text-xs font-bold text-[#4A5E3E]">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">{children}</div>
    </div>
  );
}

function formatRemaining(expiresAt) {
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return 'Expired';
  const totalMin = Math.floor(diff / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

const ORDER_ICONS = {
  rank: '🎖️',
  key: '🗝️',
  skill: '⚡',
  balance: '💰',
  command: '⌨️',
  cosmetic: '✨',
};

const ORDER_LABELS = {
  rank: 'Rank',
  key: 'Gacha Key',
  skill: 'Skill Boost',
  balance: 'Balance',
  command: 'Command',
  cosmetic: 'Custom Prefix',
};

// ---------------------------------------------------------------------------
// Section: Invoices
// ---------------------------------------------------------------------------

function InvoicesSection() {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/invoices', { credentials: 'include' });
      if (!res.ok) throw new Error('Gagal memuat invoice');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInvoices();
    // Poll tiap 5 detik supaya auto-paid dari MacroDroid langsung kedeteksi
    const interval = setInterval(fetchInvoices, 5000);
    // Refresh juga saat tab di-focus kembali
    function onFocus() { fetchInvoices(); }
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchInvoices]);

  function requestConfirm(id) { setConfirmId(id); }
  function cancelConfirm() { setConfirmId(null); }

  async function handleMarkPaid(id) {
    if (markingId) return;
    setConfirmId(null);
    setMarkingId(id);
    try {
      const res = await fetch(`/api/admin/invoices?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Gagal menandai lunas');
      }
      const resData = await res.json().catch(() => ({}));
      const rcon = resData.rcon;
      if (rcon) {
        showToast(
          rcon.ok
            ? 'Invoice lunas — RCON berhasil dieksekusi'
            : `Invoice lunas — RCON gagal: ${rcon.error || 'unknown'}`,
          rcon.ok ? 'success' : 'error',
        );
      } else {
        showToast('Invoice ditandai lunas & notifikasi Discord terkirim', 'success');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <SectionCard
      icon={FileText}
      title="Invoice Masuk"
      badge={items.length > 0 ? items.length : undefined}
    >
      {fetching ? (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B4E035]/20 border-t-[#B4E035]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <CheckCircle size={32} className="text-success/40" />
          <p className="text-sm text-[#6B7F5A]">Tidak ada invoice pending.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7F5A]">
            Menunggu pembayaran
          </p>
          {items.map((item) => (
            <InvoiceItem
              key={item.id}
              item={item}
              onMark={handleMarkPaid}
              marking={markingId === item.id}
              confirming={confirmId === item.id}
              onRequestConfirm={requestConfirm}
              onCancelConfirm={cancelConfirm}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function InvoiceItem({ item, onMark, marking, confirming, onRequestConfirm, onCancelConfirm }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(item.expiresAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(formatRemaining(item.expiresAt)), 1000);
    return () => clearInterval(id);
  }, [item.expiresAt]);

  const details = item.details || {};

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/[0.04] px-4 py-3 transition-colors hover:border-warning/50">
      <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
        Menunggu Pembayaran
      </div>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg leading-none">{ORDER_ICONS[item.type] || '📦'}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-[#1A2E1A]">{item.nick}</span>
            <span className="text-xs text-[#6B7F5A]">·</span>
            <span className="text-xs text-[#6B7F5A]">{item.platform}</span>
            <span className="rounded border border-[#D8D1C0] bg-[#F0EBE0] px-1.5 py-0.5 text-[10px] text-[#6B7F5A]">
              {ORDER_LABELS[item.type] || item.type}
            </span>
          </div>

          {item.type === 'rank' && details.target && (
            <p className="mt-0.5 text-xs text-[#4A5E3E]">
              Rank: {details.target}
              {details.owned ? ` (dari ${details.owned.toUpperCase()})` : ''}
              {details.duration ? ` · ${details.duration}` : ''}
            </p>
          )}
          {item.type === 'key' && details.keyName && (
            <p className="mt-0.5 text-xs text-[#4A5E3E]">{details.keyName} × {details.qty}</p>
          )}
          {item.type === 'skill' && details.skillName && (
            <p className="mt-0.5 text-xs text-[#4A5E3E]">{details.skillName} × {details.levels} level</p>
          )}
          {item.type === 'balance' && details.balance && (
            <p className="mt-0.5 text-xs text-[#4A5E3E]">{Number(details.balance).toLocaleString('id-ID')} balance</p>
          )}
          {item.type === 'command' && details.cmdName && (
            <p className="mt-0.5 text-xs text-[#4A5E3E]">{details.cmdName} · {details.duration}</p>
          )}
          {item.type === 'cosmetic' && details.prefixText && (
            <p className="mt-0.5 text-xs text-[#4A5E3E]">[{details.prefixText}]</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#748F1C]">
              {formatRupiah(item.finalAmount)}
            </span>
            <span className="text-xs text-[#6B7F5A]">{item.paymentMethod}</span>
            {details.discountPct > 0 && (
              <span className="rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                -{details.discountPct}%
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-[#6B7F5A]">
              <Clock size={10} />
              {remaining}
            </span>
          </div>
        </div>

        {!confirming && (
          <button
            onClick={() => onRequestConfirm(item.id)}
            disabled={marking}
            aria-label="Tandai lunas"
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[#B4E035]/50 bg-[#B4E035]/15 px-3 py-1.5 text-xs font-semibold text-[#748F1C] transition-colors hover:bg-[#B4E035]/25 hover:border-[#B4E035]/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {marking ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-[#B4E035]/40 border-t-[#B4E035]" />
            ) : (
              <CheckCircle size={13} />
            )}
            Tandai Lunas
          </button>
        )}
        {confirming && (
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-semibold text-warning">Yakin lunas?</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCancelConfirm}
                className="rounded-lg border border-[#D8D1C0] bg-[#FAFAF7] px-2.5 py-1 text-xs font-semibold text-[#6B7F5A] transition-colors hover:border-[#D8D1C0] hover:text-[#1A2E1A]"
              >
                Batal
              </button>
              <button
                onClick={() => onMark(item.id)}
                disabled={marking}
                className="flex items-center gap-1 rounded-lg border border-success/50 bg-success/15 px-2.5 py-1 text-xs font-semibold text-success transition-colors hover:bg-success/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {marking ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-success/40 border-t-success" />
                ) : (
                  <CheckCircle size={12} />
                )}
                Ya, Lunas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Donate Orders
// ---------------------------------------------------------------------------

function DonateOrdersSection() {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/donate-orders', { credentials: 'include' });
      if (!res.ok) throw new Error('Gagal memuat donasi pending');
      const data = await res.json();
      setItems(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    function onFocus() { fetchOrders(); }
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchOrders]);

  function requestConfirm(id) { setConfirmId(id); }
  function cancelConfirm() { setConfirmId(null); }

  async function handleMarkPaid(id) {
    if (markingId) return;
    setConfirmId(null);
    setMarkingId(id);
    try {
      const res = await fetch(`/api/admin/donate-orders?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Gagal mengkonfirmasi donasi');
      }
      showToast('Donasi dikonfirmasi & notifikasi Discord terkirim 💚', 'success');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMarkingId(null);
    }
  }

  async function handleDelete(id) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/donate-orders?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Order donasi dihapus', 'success');
    } catch {
      showToast('Gagal menghapus order', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <SectionCard
      icon={Heart}
      title="Donasi Pending"
      badge={items.length > 0 ? items.length : undefined}
    >
      {fetching ? (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B4E035]/20 border-t-[#B4E035]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Heart size={32} className="text-[#B4E035]/40" />
          <p className="text-sm text-[#6B7F5A]">Tidak ada donasi pending.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7F5A]">
            Menunggu konfirmasi pembayaran QRIS
          </p>
          {items.map((item) => (
            <DonateOrderItem
              key={item.id}
              item={item}
              onMark={handleMarkPaid}
              onDelete={handleDelete}
              marking={markingId === item.id}
              deleting={deletingId === item.id}
              confirming={confirmId === item.id}
              onRequestConfirm={requestConfirm}
              onCancelConfirm={cancelConfirm}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function DonateOrderItem({ item, onMark, onDelete, marking, deleting, confirming, onRequestConfirm, onCancelConfirm }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(item.expiresAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(formatRemaining(item.expiresAt)), 1000);
    return () => clearInterval(id);
  }, [item.expiresAt]);

  return (
    <div className="rounded-xl border border-[#B4E035]/30 bg-[#B4E035]/[0.04] transition-colors hover:border-[#B4E035]/50">
      {/* ── Info ── */}
      <div className="px-4 pt-3 pb-2.5">
        {/* Row 1: nama + nominal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-base leading-none">💚</span>
            <span className="truncate font-semibold text-sm text-[#1A2E1A]">{item.donorName}</span>
            {item.nick
              ? <span className="shrink-0 rounded border border-[#B4E035]/30 bg-[#B4E035]/10 px-1.5 py-0.5 font-mono text-[10px] text-[#748F1C]">{item.nick}</span>
              : <span className="shrink-0 rounded border border-[#D8D1C0] bg-[#F0EBE0] px-1.5 py-0.5 text-[10px] text-[#6B7F5A]">Anonim</span>
            }
          </div>
          <span className="shrink-0 font-mono text-sm font-bold text-[#748F1C]">
            {formatRupiah(item.totalAmount)}
          </span>
        </div>

        {/* Row 2: pesan (jika ada) */}
        {item.message && (
          <p className="mt-1.5 line-clamp-2 text-xs italic text-[#4A5E3E]">"{item.message}"</p>
        )}

        {/* Row 3: meta — suffix + timer */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#6B7F5A]">
          {item.suffix > 0 && (
            <span className="rounded border border-[#D8D1C0] bg-[#F0EBE0] px-1.5 py-0.5 font-mono text-[10px]">
              +{item.suffix} angka unik
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock size={10} />
            {remaining}
          </span>
          <span className="ml-auto text-[10px] font-mono text-[#8A9E7A]">QRIS</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="border-t border-[#B4E035]/15 px-3 py-2">
        {!confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(item.id)}
              disabled={deleting || marking}
              aria-label="Batalkan order"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger/[0.07] text-danger transition-colors hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting
                ? <span className="h-3 w-3 animate-spin rounded-full border border-danger/40 border-t-danger" />
                : <Trash2 size={13} />}
            </button>
            <button
              onClick={() => onRequestConfirm(item.id)}
              disabled={marking || deleting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#B4E035]/50 bg-[#B4E035]/15 py-1.5 text-xs font-semibold text-[#748F1C] transition-colors hover:bg-[#B4E035]/25 hover:border-[#B4E035]/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {marking
                ? <span className="h-3 w-3 animate-spin rounded-full border border-[#B4E035]/40 border-t-[#B4E035]" />
                : <CheckCircle size={13} />}
              Tandai Lunas
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xs font-semibold text-[#748F1C]">Konfirmasi donasi ini?</span>
            <button
              onClick={onCancelConfirm}
              className="rounded-lg border border-[#D8D1C0] bg-[#F0EBE0] px-3 py-1.5 text-xs font-semibold text-[#6B7F5A] transition-colors hover:text-[#1A2E1A]"
            >
              Batal
            </button>
            <button
              onClick={() => onMark(item.id)}
              disabled={marking}
              className="flex items-center gap-1 rounded-lg border border-[#B4E035]/50 bg-[#B4E035]/20 px-3 py-1.5 text-xs font-semibold text-[#748F1C] transition-colors hover:bg-[#B4E035]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {marking
                ? <span className="h-3 w-3 animate-spin rounded-full border border-[#B4E035]/40 border-t-[#B4E035]" />
                : <CheckCircle size={12} />}
              Ya, Konfirmasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section A — Announcements
// ---------------------------------------------------------------------------

function AnnouncementsSection() {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [text, setText] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcements', { credentials: 'include' });
      if (!res.ok) throw new Error('Gagal memuat pengumuman');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.announcements ?? []));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim() || !duration) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), durationMinutes: Number(duration) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.message || 'Gagal menambah pengumuman');
      }
      showToast('Pengumuman berhasil ditambahkan', 'success');
      setText('');
      setDuration('');
      await fetchAnnouncements();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmDelete(id) {
    setConfirmId(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Pengumuman dihapus', 'success');
    fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});
  }

  // Filter expired dari tampilan (expired auto-hilang; GET API juga sudah filter)
  const activeItems = items.filter((i) => new Date(i.expiresAt) > new Date());

  return (
    <SectionCard icon={Megaphone} title="Manajemen Announcement">
      <form onSubmit={handleAdd} className="mb-6 space-y-4">
        <div>
          <FieldLabel required>Teks Pengumuman</FieldLabel>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tuliskan isi pengumuman di sini…"
            required
            rows={3}
            disabled={submitting}
            className={cn(fieldBase, 'resize-none')}
          />
        </div>
        <div>
          <FieldLabel required>Durasi (menit)</FieldLabel>
          <input
            type="number"
            min={1}
            max={10080}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="misal: 60"
            required
            disabled={submitting}
            className={fieldBase}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={submitting || !text.trim() || !duration}
          className="gap-1.5"
        >
          {submitting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1A2E1A]/30 border-t-[#1A2E1A]" />
          ) : (
            <Plus size={14} />
          )}
          Tambah Pengumuman
        </Button>
      </form>

      <div className="space-y-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7F5A]">
          Aktif sekarang
        </p>
        {fetching ? (
          <div className="flex justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B4E035]/20 border-t-[#B4E035]" />
          </div>
        ) : activeItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#6B7F5A]">Belum ada pengumuman aktif.</p>
        ) : (
          activeItems.map((item) => (
            <AnnouncementItem
              key={item.id}
              item={item}
              confirming={confirmId === item.id}
              onRequestDelete={() => setConfirmId(item.id)}
              onCancelDelete={() => setConfirmId(null)}
              onConfirmDelete={handleConfirmDelete}
            />
          ))
        )}
      </div>
    </SectionCard>
  );
}

function AnnouncementItem({ item, confirming, onRequestDelete, onCancelDelete, onConfirmDelete }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(item.expiresAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(formatRemaining(item.expiresAt)), 15000);
    return () => clearInterval(id);
  }, [item.expiresAt]);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#D8D1C0] bg-[#F5F2EA] px-4 py-3 transition-colors hover:border-[#B4E035]/30">
      <BellRing size={15} className="mt-0.5 shrink-0 text-[#748F1C]" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-[#1A2E1A]">{item.text}</p>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#6B7F5A]">
          <Clock size={11} />{remaining}
        </span>
      </div>
      {!confirming && (
        <button
          onClick={onRequestDelete}
          aria-label="Hapus pengumuman"
          className="shrink-0 rounded-lg p-1.5 text-[#6B7F5A] transition-colors hover:bg-danger/10 hover:text-danger-bright"
        >
          <Trash2 size={14} />
        </button>
      )}
      {confirming && (
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-semibold text-danger/80">Yakin hapus?</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancelDelete}
              className="rounded-lg border border-[#D8D1C0] bg-[#FAFAF7] px-2.5 py-1 text-xs font-semibold text-[#6B7F5A] transition-colors hover:border-[#B4E035]/30 hover:text-[#1A2E1A]"
            >
              Batal
            </button>
            <button
              onClick={() => onConfirmDelete(item.id)}
              className="flex items-center gap-1 rounded-lg border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger-bright transition-colors hover:bg-danger/20"
            >
              <Trash2 size={12} />
              Ya, Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section B — Discounts
// ---------------------------------------------------------------------------

const DISCOUNT_CATEGORIES = ['Rank', 'Gacha Key', 'Balance', 'Skill Boost'];

function DiscountsSection() {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('');
  const [categories, setCategories] = useState([]);
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const fetchDiscounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/discounts', { credentials: 'include' });
      if (!res.ok) throw new Error('Gagal memuat diskon');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : (data.discounts ?? []));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  function toggleCategory(cat) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!code.trim() || !percent || categories.length === 0 || !duration) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          percent: Number(percent),
          categories,
          durationMinutes: Number(duration),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.message || 'Gagal menambah diskon');
      }
      showToast('Kode diskon berhasil ditambahkan', 'success');
      setCode('');
      setPercent('');
      setCategories([]);
      setDuration('');
      await fetchDiscounts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmDelete(id) {
    setConfirmId(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Diskon dihapus', 'success');
    fetch(`/api/admin/discounts?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});
  }

  const activeItems = items.filter((i) => new Date(i.expiresAt) > new Date());
  const expiredItems = items.filter((i) => new Date(i.expiresAt) <= new Date());

  return (
    <SectionCard icon={PercentCircle} title="Manajemen Diskon">
      <form onSubmit={handleAdd} className="mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Kode Diskon</FieldLabel>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER25"
              required
              maxLength={32}
              disabled={submitting}
              className={cn(fieldBase, 'font-mono tracking-widest')}
            />
          </div>
          <div>
            <FieldLabel required>Persen (%)</FieldLabel>
            <input
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="25"
              required
              disabled={submitting}
              className={fieldBase}
            />
          </div>
        </div>

        <div>
          <FieldLabel required>Kategori</FieldLabel>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {DISCOUNT_CATEGORIES.map((cat) => {
              const active = categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  disabled={submitting}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-[#B4E035]/50 bg-[#B4E035]/15 text-[#748F1C]'
                      : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] hover:border-[#B4E035]/30 hover:text-[#4A5E3E]'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          {categories.length === 0 && (
            <p className="mt-1.5 text-xs text-danger/70">Pilih minimal satu kategori</p>
          )}
        </div>

        <div>
          <FieldLabel required>Durasi (menit)</FieldLabel>
          <input
            type="number"
            min={1}
            max={10080}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="misal: 120"
            required
            disabled={submitting}
            className={fieldBase}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={submitting || !code.trim() || !percent || categories.length === 0 || !duration}
          className="gap-1.5"
        >
          {submitting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1A2E1A]/30 border-t-[#1A2E1A]" />
          ) : (
            <Plus size={14} />
          )}
          Tambah Diskon
        </Button>
      </form>

      <div className="space-y-2">
        {fetching ? (
          <div className="flex justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#6B7F5A]/20 border-t-[#6B7F5A]" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#6B7F5A]">Belum ada diskon.</p>
        ) : (
          <>
            {activeItems.length > 0 && (
              <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7F5A]">
                  Diskon aktif
                </p>
                {activeItems.map((item) => (
                  <DiscountItem
                    key={item.id}
                    item={item}
                    expired={false}
                    confirming={confirmId === item.id}
                    onRequestDelete={() => setConfirmId(item.id)}
                    onCancelDelete={() => setConfirmId(null)}
                    onConfirmDelete={handleConfirmDelete}
                  />
                ))}
              </>
            )}
            {expiredItems.length > 0 && (
              <>
                {activeItems.length > 0 && <div className="my-3 border-t border-[#D8D1C0]" />}
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7F5A]/60">
                  Sudah expired
                </p>
                {expiredItems.map((item) => (
                  <DiscountItem
                    key={item.id}
                    item={item}
                    expired={true}
                    confirming={confirmId === item.id}
                    onRequestDelete={() => setConfirmId(item.id)}
                    onCancelDelete={() => setConfirmId(null)}
                    onConfirmDelete={handleConfirmDelete}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </SectionCard>
  );
}

function DiscountItem({ item, expired, confirming, onRequestDelete, onCancelDelete, onConfirmDelete }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(item.expiresAt));

  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => setRemaining(formatRemaining(item.expiresAt)), 15000);
    return () => clearInterval(id);
  }, [item.expiresAt, expired]);

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
      expired
        ? 'border-[#D8D1C0]/40 bg-[#FAFAF7]/60 opacity-60'
        : 'border-[#D8D1C0] bg-[#F5F2EA] hover:border-[#B4E035]/30'
    )}>
      <PercentCircle size={15} className={cn('mt-0.5 shrink-0', expired ? 'text-[#8A9E7A]' : 'text-[#6B7F5A]')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-sm font-bold tracking-wider', expired ? 'text-[#6B7F5A]' : 'text-[#1A2E1A]')}>
            {item.code}
          </span>
          <span className={cn(
            'rounded-md border px-1.5 py-0.5 text-xs font-semibold',
            expired
              ? 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A]'
              : 'border-[#B4E035]/35 bg-[#B4E035]/10 text-[#748F1C]'
          )}>
            -{item.percent}%
          </span>
          {expired && (
            <span className="rounded border border-[#D8D1C0] bg-[#F0EBE0] px-1.5 py-0.5 text-[10px] font-semibold text-[#8A9E7A]">
              Expired
            </span>
          )}
        </div>
        {item.categories && item.categories.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.categories.map((cat) => (
              <span key={cat} className="rounded border border-[#D8D1C0] bg-[#F0EBE0] px-1.5 py-0.5 text-[10px] text-[#6B7F5A]">
                {cat}
              </span>
            ))}
          </div>
        )}
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#6B7F5A]">
          {expired ? (
            <span className="text-[#8A9E7A]">Berakhir {new Date(item.expiresAt).toLocaleDateString('id-ID')}</span>
          ) : (
            <><Clock size={11} />{remaining}</>
          )}
        </span>
      </div>
      {!confirming && (
        <button
          onClick={onRequestDelete}
          aria-label="Hapus diskon"
          className="shrink-0 rounded-lg p-1.5 text-[#6B7F5A] transition-colors hover:bg-danger/10 hover:text-danger-bright"
        >
          <Trash2 size={14} />
        </button>
      )}
      {confirming && (
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-semibold text-danger/80">Yakin hapus?</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancelDelete}
              className="rounded-lg border border-[#D8D1C0] bg-[#FAFAF7] px-2.5 py-1 text-xs font-semibold text-[#6B7F5A] transition-colors hover:border-[#B4E035]/30 hover:text-[#1A2E1A]"
            >
              Batal
            </button>
            <button
              onClick={() => onConfirmDelete(item.id)}
              className="flex items-center gap-1 rounded-lg border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger-bright transition-colors hover:bg-danger/20"
            >
              <Trash2 size={12} />
              Ya, Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section C — RCON Manual
// ---------------------------------------------------------------------------

const RANK_OPTIONS = ['SCOUT','VOYAGER','ORBITER','RAVEST','VORTEX','QUANTUM','GALATICS','UNIVERSE'];
const KEY_OPTIONS  = ['basic','vote','vip','legend','aerospace'];

const ACTION_TABS = [
  { id: 'rank',   label: '🎖️ Rank' },
  { id: 'money',  label: '💰 Money' },
  { id: 'key',    label: '🗝️ Key' },
  { id: 'bansos', label: '🎁 Bansos' },
  { id: 'event',  label: '🎪 Event' },
];

function RconSection() {
  const showToast = useToast();
  const [action, setAction] = useState('rank');
  const [loading, setLoading] = useState(false);

  // per-action state
  const [nick, setNick] = useState('');
  const [rankKey, setRankKey] = useState('SCOUT');
  const [rankDuration, setRankDuration] = useState('permanent');
  const [money, setMoney] = useState('');
  const [keyName, setKeyName] = useState('basic');
  const [keyQty, setKeyQty] = useState('');
  const [bansosSub, setBansosSub] = useState('give');
  const [bansosKeyName, setBansosKeyName] = useState('basic');
  const [bansosAmount, setBansosAmount] = useState('');
  const [bansosDuration, setBansosDuration] = useState('');
  const [bansosCancelId, setBansosCancelId] = useState('');
  const [eventSub, setEventSub] = useState('add');
  const [eventName, setEventName] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventDuration, setEventDuration] = useState('');
  const [eventTarget, setEventTarget] = useState('');
  const [eventTimeAction, setEventTimeAction] = useState('add');
  const [eventTime, setEventTime] = useState('');

  function resetFields() {
    setNick(''); setMoney(''); setKeyQty('');
    setBansosAmount(''); setBansosDuration(''); setBansosCancelId('');
    setEventName(''); setEventStart(''); setEventDuration('');
    setEventTarget(''); setEventTime('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let payload = { action };
    if (action === 'rank')   payload = { ...payload, nick: nick.trim(), rankKey, duration: rankDuration };
    if (action === 'money')  payload = { ...payload, nick: nick.trim(), amount: Number(money) };
    if (action === 'key')    payload = { ...payload, nick: nick.trim(), keyName, qty: Number(keyQty) };
    if (action === 'bansos') {
      payload.subAction = bansosSub;
      if (bansosSub === 'give')   payload = { ...payload, keyName: bansosKeyName, amount: Number(bansosAmount), duration: bansosDuration.trim() || undefined };
      if (bansosSub === 'cancel') payload = { ...payload, bansosId: bansosCancelId.trim() };
      // list tidak butuh field tambahan
    }
    if (action === 'event') {
      payload.subAction = eventSub;
      if (eventSub === 'add')    payload = { ...payload, name: eventName.trim(), startTime: eventStart.trim(), duration: eventDuration.trim() };
      if (eventSub === 'clear')  payload = { ...payload, target: eventTarget.trim() };
      if (eventSub === 'time')   payload = { ...payload, timeAction: eventTimeAction, target: eventTarget.trim(), time: eventTime.trim() };
    }

    try {
      const res = await fetch('/api/admin/rcon', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        showToast(`RCON berhasil: ${data.response || 'OK'}`, 'success');
        resetFields();
      } else {
        showToast(`RCON gagal: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const needsNick = ['rank', 'money', 'key'].includes(action);

  const tabInactive = 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] hover:border-[#B4E035]/30 hover:text-[#4A5E3E]';
  const tabActive = 'border-[#B4E035]/50 bg-[#B4E035]/15 text-[#748F1C]';

  return (
    <SectionCard icon={Terminal} title="RCON Manual">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Action tabs */}
        <div>
          <FieldLabel required>Tipe Aksi</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {ACTION_TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAction(id)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                  action === id ? tabActive : tabInactive,
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Nick — hanya untuk rank/money/key */}
        {needsNick && (
          <div>
            <FieldLabel required>Nickname Player</FieldLabel>
            <input
              type="text"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Nama IGN player…"
              required
              disabled={loading}
              className={fieldBase}
            />
          </div>
        )}

        {/* Rank */}
        {action === 'rank' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Rank</FieldLabel>
              <select value={rankKey} onChange={(e) => setRankKey(e.target.value)} disabled={loading} className={fieldBase}>
                {RANK_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel required>Durasi</FieldLabel>
              <select value={rankDuration} onChange={(e) => setRankDuration(e.target.value)} disabled={loading} className={fieldBase}>
                <option value="permanent">Permanent</option>
                <option value="monthly">Monthly (30 hari)</option>
              </select>
            </div>
          </div>
        )}

        {/* Money */}
        {action === 'money' && (
          <div>
            <FieldLabel required>Jumlah Money (eco)</FieldLabel>
            <input type="number" min={1} value={money} onChange={(e) => setMoney(e.target.value)}
              placeholder="misal: 10000" required disabled={loading} className={fieldBase} />
          </div>
        )}

        {/* Key */}
        {action === 'key' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Tipe Key</FieldLabel>
              <select value={keyName} onChange={(e) => setKeyName(e.target.value)} disabled={loading} className={fieldBase}>
                {KEY_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel required>Jumlah</FieldLabel>
              <input type="number" min={1} value={keyQty} onChange={(e) => setKeyQty(e.target.value)}
                placeholder="misal: 5" required disabled={loading} className={fieldBase} />
            </div>
          </div>
        )}

        {/* Bansos */}
        {action === 'bansos' && (
          <>
            <div>
              <FieldLabel required>Sub-Aksi</FieldLabel>
              <div className="flex gap-2">
                {[{ id:'give', label:'🎁 Give' }, { id:'cancel', label:'❌ Cancel' }, { id:'list', label:'📋 List' }].map(({ id, label }) => (
                  <button key={id} type="button" onClick={() => setBansosSub(id)} disabled={loading}
                    className={cn('flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors',
                      bansosSub === id ? tabActive : tabInactive
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {bansosSub === 'give' && (
              <>
                <div>
                  <FieldLabel required>Tipe Key</FieldLabel>
                  <select value={bansosKeyName} onChange={(e) => setBansosKeyName(e.target.value)} disabled={loading} className={fieldBase}>
                    {KEY_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Jumlah</FieldLabel>
                    <input type="number" min={1} value={bansosAmount} onChange={(e) => setBansosAmount(e.target.value)}
                      placeholder="misal: 5" required disabled={loading} className={fieldBase} />
                  </div>
                  <div>
                    <FieldLabel>Durasi (opsional)</FieldLabel>
                    <input type="text" value={bansosDuration} onChange={(e) => setBansosDuration(e.target.value)}
                      placeholder="30s, 5m, 1h (kosong = langsung)" disabled={loading} className={fieldBase} />
                  </div>
                </div>
                <p className="text-[11px] text-[#6B7F5A]">
                  Command: <code className="font-mono text-[#748F1C]">bansos {bansosKeyName} {bansosAmount || '?'}{bansosDuration ? ` ${bansosDuration}` : ''}</code>
                  {' '}→ <code className="font-mono text-[#4A5E3E]">case key giveall {bansosKeyName} {bansosAmount || '?'}</code>
                </p>
              </>
            )}

            {bansosSub === 'cancel' && (
              <div>
                <FieldLabel required>ID Bansos</FieldLabel>
                <input type="text" value={bansosCancelId} onChange={(e) => setBansosCancelId(e.target.value)}
                  placeholder="misal: 1" required disabled={loading} className={fieldBase} />
                <p className="mt-1 text-[11px] text-[#6B7F5A]">
                  Gunakan <strong>bansos list</strong> dulu untuk lihat ID aktif.
                </p>
              </div>
            )}

            {bansosSub === 'list' && (
              <p className="rounded-xl border border-[#D8D1C0] bg-[#F5F2EA] px-4 py-3 text-xs text-[#6B7F5A]">
                Klik <strong>Eksekusi RCON</strong> untuk melihat daftar bansos yang sedang aktif di server.
              </p>
            )}
          </>
        )}

        {/* Event */}
        {action === 'event' && (
          <>
            <div>
              <FieldLabel required>Sub-Aksi</FieldLabel>
              <div className="flex gap-2">
                {[{ id:'add', label:'➕ Add' }, { id:'clear', label:'🗑️ Clear' }, { id:'time', label:'⏱️ Time' }].map(({ id, label }) => (
                  <button key={id} type="button" onClick={() => setEventSub(id)} disabled={loading}
                    className={cn('flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors',
                      eventSub === id ? tabActive : tabInactive
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {eventSub === 'add' && (
              <>
                <div>
                  <FieldLabel required>Nama Event</FieldLabel>
                  <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)}
                    placeholder="misal: pvp_tournament" required disabled={loading} className={fieldBase} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Waktu Mulai</FieldLabel>
                    <input type="text" value={eventStart} onChange={(e) => setEventStart(e.target.value)}
                      placeholder="misal: 10, 1h" required disabled={loading} className={fieldBase} />
                  </div>
                  <div>
                    <FieldLabel required>Durasi</FieldLabel>
                    <input type="text" value={eventDuration} onChange={(e) => setEventDuration(e.target.value)}
                      placeholder="misal: 30, 2h" required disabled={loading} className={fieldBase} />
                  </div>
                </div>
              </>
            )}

            {eventSub === 'clear' && (
              <div>
                <FieldLabel required>ID / Nama Event</FieldLabel>
                <input type="text" value={eventTarget} onChange={(e) => setEventTarget(e.target.value)}
                  placeholder="misal: pvp_tournament atau 1" required disabled={loading} className={fieldBase} />
              </div>
            )}

            {eventSub === 'time' && (
              <>
                <div>
                  <FieldLabel required>Aksi Waktu</FieldLabel>
                  <div className="flex gap-2">
                    {[{ id:'add', label:'➕ Tambah' }, { id:'reduce', label:'➖ Kurangi' }].map(({ id, label }) => (
                      <button key={id} type="button" onClick={() => setEventTimeAction(id)} disabled={loading}
                        className={cn('flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors',
                          eventTimeAction === id ? tabActive : tabInactive
                        )}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>ID / Nama Event</FieldLabel>
                    <input type="text" value={eventTarget} onChange={(e) => setEventTarget(e.target.value)}
                      placeholder="misal: pvp_tournament" required disabled={loading} className={fieldBase} />
                  </div>
                  <div>
                    <FieldLabel required>Waktu</FieldLabel>
                    <input type="text" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                      placeholder="misal: 10, 1h" required disabled={loading} className={fieldBase} />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading}
          className="w-full gap-1.5"
        >
          {loading
            ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1A2E1A]/30 border-t-[#1A2E1A]" />
            : <Zap size={14} />}
          Eksekusi RCON
        </Button>
      </form>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const { isAdmin, loading, logout } = useAuth();
  const showToast = useToast();
  const router = useRouter();
  const loggingOut = useRef(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/admin/login');
    }
  }, [isAdmin, loading, router]);

  async function handleLogout() {
    if (loggingOut.current) return;
    loggingOut.current = true;
    try {
      await logout();
      router.replace('/admin/login');
    } catch {
      showToast('Gagal logout, coba lagi.', 'error');
    } finally {
      loggingOut.current = false;
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F4EFE4]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#B4E035]/20 border-t-[#B4E035]" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="relative min-h-screen bg-[#F4EFE4]">
      <div className="bg-app" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#D8D1C0] bg-[#F4EFE4]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#B4E035]/40 bg-[#B4E035]/10">
              <Shield size={18} className="text-[#748F1C]" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-[#1A2E1A]">AeroBlast Admin</p>
              <p className="text-[10px] text-[#6B7F5A]">Panel Administrasi</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-[#6B7F5A] hover:text-danger-bright"
          >
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7">
          <h1 className="font-display text-2xl font-bold text-[#1A2E1A]">
            Selamat datang, Admin
          </h1>
          <p className="mt-0.5 text-sm text-[#6B7F5A]">
            Kelola invoice, pengumuman, dan kode diskon dari sini.
          </p>
        </div>

        {/* Invoices — full width */}
        <div className="mb-6">
          <InvoicesSection />
        </div>

        {/* Donate orders — full width */}
        <div className="mb-6">
          <DonateOrdersSection />
        </div>

        {/* Announcements + Discounts — side by side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnnouncementsSection />
          <DiscountsSection />
        </div>

        {/* RCON Manual — full width */}
        <div className="mt-6">
          <RconSection />
        </div>
      </main>
    </div>
  );
}

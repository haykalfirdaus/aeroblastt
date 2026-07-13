import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CheckCircle,
  Clock,
  FileText,
  LogOut,
  Megaphone,
  PercentCircle,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const fieldBase =
  'w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50';

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
      {required && <span className="text-neon-400"> *</span>}
    </label>
  );
}

function SectionCard({ icon: Icon, title, accent = 'neon-500', badge, children }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent, var(--color-${accent}), transparent)`,
        }}
      />
      <div className="flex items-center gap-3 border-b border-white/6 px-6 py-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
          style={{ color: `var(--color-${accent})` }}
        >
          <Icon size={18} />
        </div>
        <h2 className="font-display text-base font-semibold text-text-bright">{title}</h2>
        {badge !== undefined && (
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-bold text-text-muted">
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
  const [paidIds, setPaidIds] = useState(new Set());
  const [markingId, setMarkingId] = useState(null);
  // confirmId: id invoice yang sedang menunggu konfirmasi "Yakin?"
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
    const interval = setInterval(fetchInvoices, 30000);
    return () => clearInterval(interval);
  }, [fetchInvoices]);

  function requestConfirm(id) {
    setConfirmId(id);
  }

  function cancelConfirm() {
    setConfirmId(null);
  }

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
      showToast('Invoice ditandai lunas & notifikasi Discord terkirim', 'success');
      setPaidIds((prev) => new Set([...prev, id]));
      // Hapus dari DB 1 menit setelah dikonfirmasi, lalu hilangkan dari list
      setTimeout(async () => {
        await fetch(`/api/admin/invoices?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(() => {});
        setItems((prev) => prev.filter((i) => i.id !== id));
        setPaidIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 60 * 1000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setMarkingId(null);
    }
  }

  const pending = items.filter((i) => !paidIds.has(i.id));
  const recentlyPaid = items.filter((i) => paidIds.has(i.id));

  return (
    <SectionCard
      icon={FileText}
      title="Invoice Masuk"
      accent="neon-500"
      badge={pending.length > 0 ? pending.length : undefined}
    >
      {fetching ? (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-neon-500/20 border-t-neon-400" />
        </div>
      ) : pending.length === 0 && recentlyPaid.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <CheckCircle size={32} className="text-success/40" />
          <p className="text-sm text-text-dim">Tidak ada invoice pending.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentlyPaid.length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success/70">
                Baru saja lunas (dihapus otomatis dalam 1 menit)
              </p>
              {recentlyPaid.map((item) => (
                <InvoiceItem key={item.id} item={item} paid onMark={handleMarkPaid} marking={false} confirming={false} onRequestConfirm={requestConfirm} onCancelConfirm={cancelConfirm} />
              ))}
              {pending.length > 0 && <div className="my-3 border-t border-white/6" />}
            </>
          )}
          {pending.length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">
                Menunggu pembayaran
              </p>
              {pending.map((item) => (
                <InvoiceItem
                  key={item.id}
                  item={item}
                  paid={false}
                  onMark={handleMarkPaid}
                  marking={markingId === item.id}
                  confirming={confirmId === item.id}
                  onRequestConfirm={requestConfirm}
                  onCancelConfirm={cancelConfirm}
                />
              ))}
            </>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function InvoiceItem({ item, paid, onMark, marking, confirming, onRequestConfirm, onCancelConfirm }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(item.expiresAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(formatRemaining(item.expiresAt)), 1000);
    return () => clearInterval(id);
  }, [item.expiresAt]);

  const details = item.details || {};

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 transition-colors',
        paid
          ? 'border-success/25 bg-success/[0.06]'
          : 'border-warning/30 bg-warning/[0.04] hover:border-warning/50'
      )}
    >
      {/* Status bar di atas */}
      <div className={cn(
        'mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider',
        paid ? 'text-success' : 'text-warning'
      )}>
        <span className={cn('h-1.5 w-1.5 rounded-full', paid ? 'bg-success' : 'bg-warning animate-pulse')} />
        {paid ? 'Sudah Lunas' : 'Menunggu Pembayaran'}
      </div>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg leading-none">{ORDER_ICONS[item.type] || '📦'}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-text-bright">{item.nick}</span>
            <span className="text-xs text-text-dim">·</span>
            <span className="text-xs text-text-dim">{item.platform}</span>
            <span className="rounded border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-text-dim">
              {ORDER_LABELS[item.type] || item.type}
            </span>
          </div>

          {item.type === 'rank' && details.target && (
            <p className="mt-0.5 text-xs text-text-muted">
              Rank: {details.target}
              {details.owned ? ` (dari ${details.owned.toUpperCase()})` : ''}
              {details.duration ? ` · ${details.duration}` : ''}
            </p>
          )}
          {item.type === 'key' && details.keyName && (
            <p className="mt-0.5 text-xs text-text-muted">{details.keyName} × {details.qty}</p>
          )}
          {item.type === 'skill' && details.skillName && (
            <p className="mt-0.5 text-xs text-text-muted">{details.skillName} × {details.levels} level</p>
          )}
          {item.type === 'balance' && details.balance && (
            <p className="mt-0.5 text-xs text-text-muted">{Number(details.balance).toLocaleString('id-ID')} balance</p>
          )}
          {item.type === 'command' && details.cmdName && (
            <p className="mt-0.5 text-xs text-text-muted">{details.cmdName} · {details.duration}</p>
          )}
          {item.type === 'cosmetic' && details.prefixText && (
            <p className="mt-0.5 text-xs text-text-muted">[{details.prefixText}]</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-bold text-neon-300">
              {formatRupiah(item.finalAmount)}
            </span>
            <span className="text-xs text-text-dim">{item.paymentMethod}</span>
            {details.discountPct > 0 && (
              <span className="rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                -{details.discountPct}%
              </span>
            )}
            {!paid && (
              <span className="inline-flex items-center gap-1 text-xs text-text-dim">
                <Clock size={10} />
                {remaining}
              </span>
            )}
          </div>
        </div>

        {!paid && !confirming && (
          <button
            onClick={() => onRequestConfirm(item.id)}
            disabled={marking}
            aria-label="Tandai lunas"
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-neon-500/40 bg-neon-500/15 px-3 py-1.5 text-xs font-semibold text-neon-300 transition-colors hover:bg-neon-500/25 hover:border-neon-400/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {marking ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-neon-400/40 border-t-neon-400" />
            ) : (
              <CheckCircle size={13} />
            )}
            Tandai Lunas
          </button>
        )}
        {!paid && confirming && (
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-semibold text-warning">Yakin lunas?</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCancelConfirm}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-text-dim transition-colors hover:border-white/25 hover:text-text-bright"
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
        {paid && (
          <span className="shrink-0 rounded-lg border border-success/30 bg-success/15 px-3 py-1.5 text-xs font-semibold text-success">
            ✓ Lunas
          </span>
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
  const [pendingDeleteIds, setPendingDeleteIds] = useState(new Set());

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
    setPendingDeleteIds((prev) => new Set([...prev, id]));
    showToast('Pengumuman akan dihapus dalam 1 menit', 'success');
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || d.message || 'Gagal menghapus pengumuman');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 60 * 1000);
  }

  return (
    <SectionCard icon={Megaphone} title="Manajemen Announcement" accent="neon-500">
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
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Plus size={14} />
          )}
          Tambah Pengumuman
        </Button>
      </form>

      <div className="space-y-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-dim">
          Aktif sekarang
        </p>
        {fetching ? (
          <div className="flex justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-neon-500/20 border-t-neon-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-dim">Belum ada pengumuman aktif.</p>
        ) : (
          items.map((item) => (
            <AnnouncementItem
              key={item.id}
              item={item}
              pending={pendingDeleteIds.has(item.id)}
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

function AnnouncementItem({ item, pending, confirming, onRequestDelete, onCancelDelete, onConfirmDelete }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(item.expiresAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(formatRemaining(item.expiresAt)), 15000);
    return () => clearInterval(id);
  }, [item.expiresAt]);

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
      pending ? 'border-danger/20 bg-danger/[0.04]' : 'border-white/6 bg-white/[0.02] hover:border-white/10'
    )}>
      <BellRing size={15} className={cn('mt-0.5 shrink-0', pending ? 'text-danger/60' : 'text-neon-400')} />
      <div className="min-w-0 flex-1">
        <p className={cn('line-clamp-2 text-sm', pending ? 'text-text-dim line-through' : 'text-text-bright')}>{item.text}</p>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-text-dim">
          {pending ? (
            <span className="text-danger/70">Dihapus dalam 1 menit…</span>
          ) : (
            <><Clock size={11} />{remaining}</>
          )}
        </span>
      </div>
      {!pending && !confirming && (
        <button
          onClick={onRequestDelete}
          aria-label="Hapus pengumuman"
          className="shrink-0 rounded-lg p-1.5 text-text-dim transition-colors hover:bg-danger/10 hover:text-danger-bright"
        >
          <Trash2 size={14} />
        </button>
      )}
      {!pending && confirming && (
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-semibold text-danger/80">Yakin hapus?</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancelDelete}
              className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-text-dim transition-colors hover:border-white/25 hover:text-text-bright"
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
  const [pendingDeleteIds, setPendingDeleteIds] = useState(new Set());

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
    setPendingDeleteIds((prev) => new Set([...prev, id]));
    showToast('Diskon akan dihapus dalam 1 menit', 'success');
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/discounts?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || d.message || 'Gagal menghapus diskon');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 60 * 1000);
  }

  return (
    <SectionCard icon={PercentCircle} title="Manajemen Diskon" accent="cyan-400">
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
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                      : 'border-white/10 bg-white/[0.03] text-text-dim hover:border-white/20 hover:text-text-muted'
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
          style={{
            background: 'linear-gradient(to right, var(--color-cyan-500), var(--color-neon-500))',
          }}
        >
          {submitting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Plus size={14} />
          )}
          Tambah Diskon
        </Button>
      </form>

      <div className="space-y-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-dim">
          Diskon aktif
        </p>
        {fetching ? (
          <div className="flex justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-dim">Belum ada diskon aktif.</p>
        ) : (
          items.map((item) => (
            <DiscountItem
              key={item.id}
              item={item}
              pending={pendingDeleteIds.has(item.id)}
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

function DiscountItem({ item, pending, confirming, onRequestDelete, onCancelDelete, onConfirmDelete }) {
  const [remaining, setRemaining] = useState(() => formatRemaining(item.expiresAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(formatRemaining(item.expiresAt)), 15000);
    return () => clearInterval(id);
  }, [item.expiresAt]);

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
      pending ? 'border-danger/20 bg-danger/[0.04]' : 'border-white/6 bg-white/[0.02] hover:border-white/10'
    )}>
      <PercentCircle size={15} className={cn('mt-0.5 shrink-0', pending ? 'text-danger/60' : 'text-cyan-400')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-sm font-bold tracking-wider', pending ? 'text-text-dim line-through' : 'text-text-bright')}>
            {item.code}
          </span>
          <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-xs font-semibold text-cyan-300">
            -{item.percent}%
          </span>
        </div>
        {item.categories && item.categories.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.categories.map((cat) => (
              <span key={cat} className="rounded border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-text-dim">
                {cat}
              </span>
            ))}
          </div>
        )}
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-text-dim">
          {pending ? (
            <span className="text-danger/70">Dihapus dalam 1 menit…</span>
          ) : (
            <><Clock size={11} />{remaining}</>
          )}
        </span>
      </div>
      {!pending && !confirming && (
        <button
          onClick={onRequestDelete}
          aria-label="Hapus diskon"
          className="shrink-0 rounded-lg p-1.5 text-text-dim transition-colors hover:bg-danger/10 hover:text-danger-bright"
        >
          <Trash2 size={14} />
        </button>
      )}
      {!pending && confirming && (
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-semibold text-danger/80">Yakin hapus?</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancelDelete}
              className="rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-text-dim transition-colors hover:border-white/25 hover:text-text-bright"
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
// Dashboard page
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const { isAdmin, loading, logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const loggingOut = useRef(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  async function handleLogout() {
    if (loggingOut.current) return;
    loggingOut.current = true;
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch {
      showToast('Gagal logout, coba lagi.', 'error');
    } finally {
      loggingOut.current = false;
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-500/20 border-t-neon-400" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="relative min-h-screen bg-void">
      <div className="bg-app" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/6 bg-void/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neon-500/30 bg-neon-500/10">
              <Shield size={18} className="text-neon-400" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-text-bright">AeroBlast Admin</p>
              <p className="text-[10px] text-text-dim">Panel Administrasi</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-text-dim hover:text-danger-bright"
          >
            <LogOut size={14} />
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7">
          <h1 className="font-display text-2xl font-bold text-text-bright">
            Selamat datang, Admin
          </h1>
          <p className="mt-0.5 text-sm text-text-dim">
            Kelola invoice, pengumuman, dan kode diskon dari sini.
          </p>
        </div>

        {/* Invoices — full width */}
        <div className="mb-6">
          <InvoicesSection />
        </div>

        {/* Announcements + Discounts — side by side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AnnouncementsSection />
          <DiscountsSection />
        </div>
      </main>
    </div>
  );
}

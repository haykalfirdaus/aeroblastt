'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  UserCircle, Receipt, Heart, Crown, Terminal, RefreshCw,
  AlertTriangle, Clock, CheckCircle2, XCircle, LogOut,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PlayerLoginPrompt } from '@/components/store/PlayerLoginPrompt';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { useToast } from '@/context/ToastContext';
import { formatRupiah } from '@/utils/currency';
import { COMMANDS } from '@/data/commands';
import { RANKS } from '@/data/ranks';
import { cn } from '@/lib/cn';

const TABS = [
  { id: 'orders', label: 'Invoice', icon: Receipt },
  { id: 'donations', label: 'Donasi', icon: Heart },
  { id: 'rank', label: 'Rank', icon: Crown },
  { id: 'commands', label: 'Command', icon: Terminal },
];

const TYPE_LABEL = {
  rank: 'Rank', key: 'Gacha Key', skill: 'Skill Boost',
  balance: 'Balance', command: 'Command', cosmetic: 'Custom Prefix',
};

const STATUS_META = {
  paid: { label: 'Lunas', icon: CheckCircle2, className: 'border-green-600/40 bg-green-600/10 text-green-800' },
  pending: { label: 'Menunggu Pembayaran', icon: Clock, className: 'border-amber-500/40 bg-amber-500/10 text-amber-800' },
  expired: { label: 'Kadaluarsa', icon: XCircle, className: 'border-[#1d2b1f]/25 bg-[#1d2b1f]/[0.06] text-[#6b7f5a]' },
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatUnixDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.expired;
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[0.65rem] font-bold', meta.className)}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function EmptyState({ icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-2 border-dashed border-[#1d2b1f]/30 bg-[#faf3e8] px-6 py-10 text-center">
      <Icon size={22} className="text-[#6b7f5a]" />
      <p className="text-sm text-[#4a5e3a]">{children}</p>
    </div>
  );
}

/** Ringkasan produk dari `details` order — bentuknya beda tiap tipe. */
function orderSummary(order) {
  const d = order.details || {};
  if (order.type === 'rank') return [d.target?.toUpperCase(), d.duration].filter(Boolean).join(' · ');
  if (order.type === 'key') return [d.keyName?.toUpperCase(), d.qty ? `${d.qty}x` : null].filter(Boolean).join(' · ');
  if (order.type === 'balance') return d.balance ? `${Number(d.balance).toLocaleString('id-ID')} balance` : '';
  if (order.type === 'command') {
    const cmd = COMMANDS.find((c) => c.key === String(d.cmdName || '').toUpperCase());
    return [cmd?.command || d.cmdName, d.duration].filter(Boolean).join(' · ');
  }
  if (order.type === 'skill') return [d.skillName, d.levels ? `${d.levels} level` : null].filter(Boolean).join(' · ');
  if (order.type === 'cosmetic') return d.prefixText ? `Prefix "${d.prefixText}"` : 'Custom Prefix';
  return '';
}

export default function AccountPage() {
  const { nick, loading: authLoading, logout } = usePlayerAuth();
  const showToast = useToast();
  const [tab, setTab] = useState('orders');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account', { credentials: 'include' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Gagal memuat data akun');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (nick) load();
    else setData(null);
  }, [nick, load]);

  async function handleLogout() {
    await logout();
    showToast('Berhasil logout', 'success');
  }

  const rankMeta = data?.rank ? RANKS.find((r) => r.key === data.rank.rank) : null;

  return (
    <PageLayout>
      {/* Header */}
      <div className="relative border-b border-2 border-[#1d2b1f] bg-[#f5ede0] px-4 py-10 text-center sm:px-6 lg:px-8">
        <span className="relative mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#4a5e3a]/30 bg-[#4a5e3a]/10 px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#354530]">
          <UserCircle size={11} />
          Akun Saya
        </span>
        <h1 className="relative font-display text-2xl font-extrabold text-[#1d2b1f] sm:text-3xl">
          Akun &amp; Riwayat Pembelian
        </h1>
        <p className="relative mt-1.5 text-xs text-[#4a5e3a]">
          Cek invoice, riwayat donasi, rank, dan command aktif kamu.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Belum login → gate pakai prompt yang sama dengan store */}
        {!authLoading && !nick && (
          <>
            <div className="mb-5 flex items-start gap-2 rounded-md border border-[#1d2b1f]/25 bg-[#faf3e8] px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#4a5e3a]" />
              <p className="text-sm text-[#4a5e3a]">
                Login dulu dengan username Minecraft kamu untuk melihat halaman akun.
              </p>
            </div>
            <PlayerLoginPrompt />
          </>
        )}

        {nick && (
          <>
            {/* Identitas + aksi */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] px-5 py-4">
              <div className="leading-tight">
                <p className="text-[11px] text-[#4a5e3a]">Login sebagai</p>
                <p className="font-mono text-lg font-bold text-[#1d2b1f]">{nick}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] px-3 py-1.5 text-xs font-semibold text-[#4a5e3a] transition-colors hover:text-[#1d2b1f] disabled:opacity-50"
                >
                  <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
                  Muat Ulang
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] px-3 py-1.5 text-xs font-semibold text-[#4a5e3a] transition-colors hover:text-[#1d2b1f]"
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-5 grid grid-cols-4 gap-2">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md border border-2 border-[#1d2b1f] px-2 py-2.5 text-xs font-bold transition-all',
                      tab === t.id ? 'bg-[#BFFF5E] text-[#1d2b1f]' : 'bg-[#faf3e8] text-[#4a5e3a] hover:bg-[#f5ece0]'
                    )}
                  >
                    <Icon size={15} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-danger/45 bg-danger/[0.08] px-4 py-3 text-xs font-medium text-[#a3271f]">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
                {error}
              </div>
            )}

            {loading && !data && (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#4a5e3a]">
                <RefreshCw size={15} className="animate-spin" />
                Memuat data akun...
              </div>
            )}

            {data && (
              <>
                {/* ── Invoice ── */}
                {tab === 'orders' && (
                  data.orders.length === 0 ? (
                    <EmptyState icon={Receipt}>Belum ada order. Semua pembelian kamu akan muncul di sini.</EmptyState>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {data.orders.map((o) => (
                        <div key={o.id} className="rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1d2b1f]">{TYPE_LABEL[o.type] || o.type}</p>
                              {orderSummary(o) && <p className="mt-0.5 truncate text-xs text-[#4a5e3a]">{orderSummary(o)}</p>}
                            </div>
                            <StatusBadge status={o.status} />
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#1d2b1f]/15 pt-2 text-[11px] text-[#6b7f5a]">
                            <span className="font-mono">#{String(o.id).slice(0, 8).toUpperCase()}</span>
                            <span>
                              {o.status === 'paid' ? `Dibayar ${formatDateTime(o.paid_at)}` : `Dibuat ${formatDateTime(o.created_at)}`}
                            </span>
                            <span className="font-mono font-bold text-[#1d2b1f]">{formatRupiah(o.total_amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* ── Donasi ── */}
                {tab === 'donations' && (
                  <>
                    <div className="mb-4 rounded-md border border-[#BFFF5E]/40 bg-[#BFFF5E]/10 px-4 py-3 text-center">
                      <p className="text-[11px] text-[#4a5e3a]">Total donasi kamu</p>
                      <p className="text-2xl font-extrabold text-[#1d2b1f]">{formatRupiah(data.totalDonated)}</p>
                    </div>
                    {data.donations.length === 0 ? (
                      <EmptyState icon={Heart}>
                        Belum ada donasi atas nama ini. Donasi anonim tidak tercatat di akun.
                      </EmptyState>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {data.donations.map((d) => (
                          <div key={d.id} className="rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-sm font-bold text-[#1d2b1f]">{formatRupiah(d.amount)}</span>
                              <span className="text-[11px] text-[#6b7f5a]">{formatDateTime(d.paid_at)}</span>
                            </div>
                            {d.message && <p className="mt-1.5 text-xs italic text-[#4a5e3a]">&ldquo;{d.message}&rdquo;</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ── Rank ── */}
                {tab === 'rank' && (
                  !data.serverDataOk ? (
                    <EmptyState icon={AlertTriangle}>
                      Data server sedang tidak bisa dibaca. Coba muat ulang beberapa saat lagi.
                    </EmptyState>
                  ) : !data.rank ? (
                    <EmptyState icon={Crown}>
                      Kamu belum punya rank berbayar — status saat ini <strong>Member</strong>.
                    </EmptyState>
                  ) : (
                    <div className="rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] px-5 py-5 text-center">
                      <p className="text-[11px] uppercase tracking-wider text-[#4a5e3a]">Rank Aktif</p>
                      <p
                        className="mt-1 font-display text-3xl font-extrabold"
                        style={rankMeta ? { color: `var(--color-${rankMeta.accent})` } : undefined}
                      >
                        {rankMeta?.name?.toUpperCase() || data.rank.rank}
                      </p>
                      <p className="mt-2 text-sm text-[#4a5e3a]">
                        {data.rank.permanent
                          ? 'Permanen — berlaku selamanya'
                          : data.rank.expiry
                            ? `Berlaku sampai ${formatUnixDate(data.rank.expiry)}`
                            : 'Berlangganan aktif'}
                      </p>
                    </div>
                  )
                )}

                {/* ── Command ── */}
                {tab === 'commands' && (
                  !data.serverDataOk ? (
                    <EmptyState icon={AlertTriangle}>
                      Data server sedang tidak bisa dibaca. Coba muat ulang beberapa saat lagi.
                    </EmptyState>
                  ) : data.commands.length === 0 ? (
                    <EmptyState icon={Terminal}>
                      Belum ada command aktif yang terdeteksi di server.
                    </EmptyState>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {data.commands.map((c) => {
                        const meta = COMMANDS.find((x) => x.key === c.key);
                        return (
                          <div key={c.key} className="flex items-center justify-between gap-3 rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] px-4 py-3">
                            <div className="min-w-0">
                              <p className="font-mono text-sm font-bold text-[#1d2b1f]">{meta?.command || c.key}</p>
                              <p className="mt-0.5 truncate text-xs text-[#4a5e3a]">{meta?.name || c.key}</p>
                            </div>
                            <span className={cn(
                              'shrink-0 rounded-md border px-2 py-0.5 text-[0.65rem] font-bold',
                              c.permanent
                                ? 'border-green-600/40 bg-green-600/10 text-green-800'
                                : 'border-amber-500/40 bg-amber-500/10 text-amber-800'
                            )}>
                              {c.permanent ? 'Permanen' : c.expiry ? `s/d ${formatUnixDate(c.expiry)}` : 'Sementara'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}

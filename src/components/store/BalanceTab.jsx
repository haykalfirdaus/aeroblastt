'use client';
import { useState } from 'react';
import { Coins, Lock } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { BALANCE_QUICK_PICKS, BALANCE_RATE } from '@/data/balance';
import { SITE } from '@/data/config';
import { buildBalanceOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
import { formatRupiah, formatNumber } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// Sort highest rupiah first (anchoring)
const PICKS_DESC = [...BALANCE_QUICK_PICKS].sort((a, b) => b.rupiah - a.rupiah);

function BalanceOrderModal({ open, onClose, initialRupiah = 0 }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState(isBedrock ? 'Bedrock / PE' : '');
  const [rupiahInput, setRupiahInput] = useState(String(initialRupiah || ''));
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);

  const rupiah = parseInt(rupiahInput) || 0;
  const balance = rupiah * BALANCE_RATE;
  const finalPrice = Math.round(rupiah * (1 - discount / 100));

  function handleQris() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (rupiah < 5000) return showToast('Minimum pembelian Rp 5.000!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    setBetaOpen(true);
  }

  function handleWa() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (rupiah < 5000) return showToast('Minimum pembelian Rp 5.000!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: (playerNick || nick).trim(), platform, balance, discountPct: discount, finalAmount: finalPrice, paymentMethod: 'Transfer / QRIS' };
    setWaLoading(true);
    sendInvoice({ type: 'balance', ...orderData });
    openWhatsApp(buildBalanceOrderMessage(orderData));
    setWaLoading(false);
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title="Top-Up Balance" badge="IN-GAME BALANCE">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div className="rounded-xl border border-neon-500/20 bg-neon-500/8 p-4 text-center">
          <p className="text-xs text-text-dim mb-1">Kurs: Rp 1 = {BALANCE_RATE} Balance</p>
          <p className="font-mono text-2xl font-bold text-neon-300">{formatNumber(balance)} <span className="text-sm font-normal text-text-dim">Balance</span></p>
        </div>
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => !isBedrock && setPlatform(e.target.value)} disabled={isBedrock}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-cyan-400">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>
        <div>
          <FieldLabel required>Jumlah Rupiah</FieldLabel>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-dim">Rp</span>
            <input
              type="number"
              min={5000}
              step={1000}
              value={rupiahInput}
              onChange={(e) => setRupiahInput(e.target.value)}
              placeholder="5000"
              className="w-full rounded-xl border border-white/12 bg-white/[0.04] pl-10 pr-4 py-3 font-mono text-sm text-text-bright outline-none transition-colors focus:border-neon-400/60"
            />
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Balance" />
        <PriceSummary basePrice={rupiah} discountPercent={discount} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-neon-300 hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="sm" onClick={handleQris} disabled={!playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>
            {playerNick ? '⚡ Bayar via QRIS Otomatis' : '🔒 Login dulu untuk order'}
          </Button>
          {playerNick && (
            <button type="button" onClick={handleWa} disabled={waLoading} className="w-full rounded-xl border border-white/12 bg-white/[0.03] py-2.5 text-sm font-semibold text-text-muted transition-all hover:border-white/20 hover:text-text-bright">
              Lanjut via WhatsApp (Manual)
            </button>
          )}
        </div>
      </div>
    </Modal>
    <BetaPaymentModal
      open={betaOpen}
      onClose={() => setBetaOpen(false)}
      productLabel={`Top-Up ${formatNumber(balance)} Balance`}
      orderPayload={{ type: 'balance', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { balance } }}
    />
    </>
  );
}

// Tier config by sorted index (0 = most expensive)
function getPickTier(idx, total) {
  const isTop = idx === 0;
  const featured = idx < Math.ceil(total * 0.5);
  return {
    featured,
    isTop,
    priceSize: isTop ? 'text-base' : featured ? 'text-sm' : 'text-xs',
    opacity: featured ? '' : 'opacity-75',
  };
}

export function BalanceTab() {
  const { nick } = usePlayerAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRupiah, setSelectedRupiah] = useState(0);

  function openWith(rupiah) {
    if (!nick) return;
    setSelectedRupiah(rupiah);
    setModalOpen(true);
  }

  const total = PICKS_DESC.length;

  return (
    <>
      <div className="mx-auto max-w-2xl">
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-neon-500/18 bg-neon-500/8">
              <Coins size={20} className="text-neon-300" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text-bright">Top-Up Balance</h3>
              <p className="text-xs text-text-dim">Kurs: Rp 1 = {BALANCE_RATE} Balance</p>
            </div>
          </div>

          <div className="mb-1 flex items-center justify-between">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-dim">Quick Pick</p>
            <p className="text-[0.65rem] text-text-faint">Tampil dari terbesar</p>
          </div>
          <p className="mb-3 text-[0.6rem] text-text-faint">Semakin ke bawah semakin terjangkau</p>

          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PICKS_DESC.map(({ rupiah, popular }, idx) => {
              const tier = getPickTier(idx, total);
              return (
                <button
                  key={rupiah}
                  type="button"
                  onClick={() => openWith(rupiah)}
                  disabled={!nick}
                  title={!nick ? 'Login dulu untuk order' : undefined}
                  className={cn(
                    'relative overflow-hidden rounded-xl border px-4 py-4 text-center transition-all',
                    tier.featured
                      ? 'border-neon-400/30 bg-neon-500/8 hover:-translate-y-0.5 hover:brightness-110'
                      : 'border-white/8 bg-white/[0.02] hover:border-white/15',
                    tier.opacity,
                    !nick && 'cursor-not-allowed opacity-50',
                  )}
                >
                  {popular && (
                    <span className="absolute right-0 top-0 rounded-bl-lg bg-neon-500 px-2 py-0.5 text-[0.6rem] font-bold text-white">
                      POPULAR
                    </span>
                  )}
                  {tier.isTop && (
                    <span className="absolute left-0 top-0 rounded-br-lg bg-warning/80 px-2 py-0.5 text-[0.6rem] font-bold text-void">
                      MAX VALUE
                    </span>
                  )}
                  <p className={cn('font-mono font-bold text-text-bright', tier.priceSize, !tier.featured && 'text-text-muted')}>
                    {formatRupiah(rupiah)}
                  </p>
                  <p className={cn('text-[0.65rem]', tier.featured ? 'text-text-dim' : 'text-text-faint')}>
                    {formatNumber(rupiah * BALANCE_RATE)} Balance
                  </p>
                </button>
              );
            })}
          </div>

          <Button fullWidth size="sm" onClick={() => openWith(0)} disabled={!nick} title={!nick ? 'Login dulu untuk order' : undefined}>
            {nick ? 'Top-Up Custom Amount' : <><Lock size={12} className="inline mr-1" />Login dulu untuk order</>}
          </Button>
        </GlassCard>
      </div>

      <BalanceOrderModal open={modalOpen} onClose={() => setModalOpen(false)} initialRupiah={selectedRupiah} />
    </>
  );
}

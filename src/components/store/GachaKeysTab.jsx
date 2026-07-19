'use client';
import { useState } from 'react';
import { Lock, Minus, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { GACHA_KEYS } from '@/data/keys';
import { SITE } from '@/data/config';
import { buildKeyOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// Highest price first (anchoring)
const KEYS_DESC = [...GACHA_KEYS].sort((a, b) => b.price - a.price);

const KEY_ACCENT = {
  BASIC: 'success',
  VOTE: 'rank-voyager',
  VIP: 'rank-vortex',
  LEGEND: 'warning',
  AEROSPACE: 'cyan-400',
};

// position 0 = Aerospace (20k), position 4 = Basic (1k)
const KEY_TIER = {
  0: { featured: true,  priceSize: 'text-xl', opacity: '', badgeTone: 'cyan',  badge: 'PREMIUM',  glow: true  },
  1: { featured: true,  priceSize: 'text-lg', opacity: '', badgeTone: 'gold',  badge: null,       glow: true  },
  2: { featured: true,  priceSize: 'text-base',opacity: '',badgeTone: 'neon',  badge: null,       glow: true  },
  3: { featured: false, priceSize: 'text-sm', opacity: 'opacity-80', badge: null, glow: false },
  4: { featured: false, priceSize: 'text-sm', opacity: 'opacity-65', badge: 'STARTER', badgeTone: 'dim', glow: false },
};

function KeyOrderModal({ keyData, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState(isBedrock ? 'Bedrock / PE' : '');
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);

  if (!keyData) return null;

  const basePrice = keyData.price * qty;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleQris() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    setBetaOpen(true);
  }

  function handleWa() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: (playerNick || nick).trim(), platform, keyName: keyData.key.toLowerCase(), qty, discountPct: discount, finalAmount: finalPrice, paymentMethod: 'Transfer / QRIS' };
    setWaLoading(true);
    sendInvoice({ type: 'key', ...orderData });
    openWhatsApp(buildKeyOrderMessage(orderData));
    setWaLoading(false);
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title={`Order ${keyData.name}`} badge="GACHA KEYS">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => !isBedrock && setPlatform(e.target.value)} disabled={isBedrock}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-[#354530]">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>
        <div>
          <FieldLabel required>Jumlah Key</FieldLabel>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-2 border-[#1d2b1f] bg-[#f5ece0] text-[#4a5e3a] transition hover:border-[#BFFF5E]/30 hover:bg-[#E8E2D5]"><Minus size={16} /></button>
            <span className="flex-1 text-center font-mono text-2xl font-bold text-[#1d2b1f]">{qty}x</span>
            <button type="button" onClick={() => setQty((q) => Math.min(999, q + 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-2 border-[#1d2b1f] bg-[#f5ece0] text-[#4a5e3a] transition hover:border-[#BFFF5E]/30 hover:bg-[#E8E2D5]"><Plus size={16} /></button>
          </div>
          <p className="mt-1.5 text-center text-xs text-[#4a5e3a]">{formatRupiah(keyData.price)} × {qty} = {formatRupiah(basePrice)}</p>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Gacha Key" />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-[#1d2b1f] hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="sm" onClick={handleQris} disabled={!playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>
            {playerNick ? '⚡ Bayar via QRIS Otomatis' : '🔒 Login dulu untuk order'}
          </Button>
          {playerNick && (
            <button type="button" onClick={handleWa} disabled={waLoading} className="w-full rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] py-2.5 text-sm font-semibold text-[#4a5e3a] transition-all hover:border-[#BFFF5E]/30 hover:text-[#1d2b1f]">
              Lanjut via WhatsApp (Manual)
            </button>
          )}
        </div>
      </div>
    </Modal>
    <BetaPaymentModal
      open={betaOpen}
      onClose={() => setBetaOpen(false)}
      productLabel={`${keyData.name} ×${qty}`}
      orderPayload={{ type: 'key', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { keyName: keyData.key.toLowerCase(), qty } }}
    />
    </>
  );
}

export function GachaKeysTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);

  return (
    <>
      <p className="mb-4 text-center text-xs text-[#6b7f5a]">
        Tampil dari harga tertinggi — semakin ke bawah semakin terjangkau
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KEYS_DESC.map((k, idx) => {
          const tier = KEY_TIER[idx] ?? KEY_TIER[4];
          const tone = KEY_ACCENT[k.key] || 'neon-400';

          return (
            <div
              key={k.key}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-md transition-all duration-200',
                tier.featured
                  ? 'border border-[#1d2b1f] bg-[#faf3e8] shadow-[2px_2px_0_#1d2b1f] hover:scale-[1.015] hover:brightness-105'
                  : 'border border-[#1d2b1f]/60 bg-[#fffdf9] hover:scale-[1.01]',
                tier.opacity,
              )}
              style={{ '--accent': `var(--color-${tone})`, animation: 'page-wipe-in 0.5s cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${idx * 80}ms` }}
            >
              {/* top shimmer */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, var(--accent), transparent)`, opacity: tier.featured ? 0.7 : 0.2 }}
              />

              <div className="flex flex-col items-center gap-3 p-5 text-center">
                {(tier.badge || k.badge) && (
                  <Badge tone={tier.badgeTone ?? 'neon'}>{tier.badge ?? k.badge}</Badge>
                )}

                <div
                  className="grid h-12 w-12 place-items-center rounded-md border border-2 border-[#1d2b1f] bg-[#f5ece0]"
                  style={{ boxShadow: tier.glow ? `0 0 20px -4px var(--accent)` : undefined }}
                >
                  <Icon name={k.icon} size={22} className={cn('text-[var(--accent)]', !tier.featured && 'opacity-70')} />
                </div>

                <div>
                  <h3 className={cn('font-display text-sm font-bold', tier.featured ? 'text-[#1d2b1f]' : 'text-[#4a5e3a]')}>
                    {k.name}
                  </h3>
                  <p className={cn('font-mono font-bold text-[#1d2b1f]', tier.priceSize, !tier.featured && 'opacity-70')}>
                    {formatRupiah(k.price)}<span className="text-xs text-[#4a5e3a] font-normal"> / key</span>
                  </p>
                </div>

                <p className={cn('text-xs', tier.featured ? 'text-[#4a5e3a]' : 'text-[#4a5e3a]')}>
                  {k.description}
                </p>

                <Button
                  fullWidth
                  variant={tier.featured ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => nick && setSelected(k)}
                  disabled={!nick}
                  title={!nick ? 'Login dulu untuk order' : undefined}
                  className={!tier.featured ? 'opacity-75' : ''}
                >
                  {nick ? 'Order Sekarang' : <><Lock size={12} className="inline mr-1" />Login dulu</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <KeyOrderModal keyData={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

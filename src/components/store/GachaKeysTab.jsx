import { useState } from 'react';
import { Check, Lock, Minus, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { PriceSummary } from './PriceSummary';
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
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState('');
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);

  if (!keyData) return null;

  const basePrice = keyData.price * qty;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleSend() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: (playerNick || nick).trim(), platform, keyName: keyData.name, qty, discountPct: discount, finalAmount: finalPrice, paymentMethod: payment };
    sendInvoice({ type: 'key', ...orderData });
    openWhatsApp(buildKeyOrderMessage(orderData));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Order ${keyData.name}`} badge="GACHA KEYS">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
        </div>
        <div>
          <FieldLabel required>Jumlah Key</FieldLabel>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/5 text-text-muted transition hover:bg-white/10"><Minus size={16} /></button>
            <span className="flex-1 text-center font-mono text-2xl font-bold text-text-bright">{qty}x</span>
            <button type="button" onClick={() => setQty((q) => Math.min(999, q + 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/5 text-text-muted transition hover:bg-white/10"><Plus size={16} /></button>
          </div>
          <p className="mt-1.5 text-center text-xs text-text-dim">{formatRupiah(keyData.price)} × {qty} = {formatRupiah(basePrice)}</p>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Gacha Key" />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <PaymentMethodPicker value={payment} onChange={setPayment} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-neon-300 hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
        <Button fullWidth size="sm" onClick={handleSend} disabled={!playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>{playerNick ? 'Order via WhatsApp' : '🔒 Login dulu untuk order'}</Button>
      </div>
    </Modal>
  );
}

export function GachaKeysTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);

  return (
    <>
      <p className="mb-4 text-center text-xs text-text-faint">
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
                'group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200',
                tier.featured
                  ? 'border-white/15 bg-white/[0.03] hover:scale-[1.015] hover:brightness-110'
                  : 'border-white/8 bg-white/[0.015] hover:scale-[1.01]',
                tier.opacity,
              )}
              style={{ '--accent': `var(--color-${tone})` }}
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
                  className="grid h-12 w-12 place-items-center rounded-xl border border-white/8 bg-white/4"
                  style={{ boxShadow: tier.glow ? `0 0 20px -4px var(--accent)` : undefined }}
                >
                  <Icon name={k.icon} size={22} className={cn('text-[var(--accent)]', !tier.featured && 'opacity-70')} />
                </div>

                <div>
                  <h3 className={cn('font-display text-sm font-bold', tier.featured ? 'text-text-bright' : 'text-text-muted')}>
                    {k.name}
                  </h3>
                  <p className={cn('font-mono font-bold text-neon-300', tier.priceSize, !tier.featured && 'opacity-70')}>
                    {formatRupiah(k.price)}<span className="text-xs text-text-dim font-normal"> / key</span>
                  </p>
                </div>

                <p className={cn('text-xs', tier.featured ? 'text-text-muted' : 'text-text-faint')}>
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

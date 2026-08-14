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

/*
 * position 0 = Aerospace (20k) … position 4 = Basic (1k).
 * Tiers are separated by ELEVATION rather than opacity: fading a cheap tier to
 * 65% made its text fail contrast and look broken. Depth ranks them instead.
 */
const KEY_TIER = {
  0: { featured: true, priceSize: 'text-xl', elevation: 'shadow-[var(--neu-out-lg)]', badgeTone: 'cyan', badge: 'PREMIUM' },
  1: { featured: true, priceSize: 'text-lg', elevation: 'shadow-[var(--neu-out-lg)]', badgeTone: 'gold', badge: null },
  2: { featured: true, priceSize: 'text-base', elevation: 'shadow-[var(--neu-out)]', badgeTone: 'neon', badge: null },
  3: { featured: false, priceSize: 'text-sm', elevation: 'shadow-[var(--neu-out)]', badge: null },
  4: { featured: false, priceSize: 'text-sm', elevation: 'shadow-[var(--neu-out)]', badge: 'STARTER', badgeTone: 'dim' },
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

  if (!keyData) return null;

  const basePrice = keyData.price * qty;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleQris() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    setBetaOpen(true);
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
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Kurangi jumlah"
              className="neu-press grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff8f0] text-[#4a5e3a] shadow-[var(--neu-out)]"
            >
              <Minus size={17} aria-hidden="true" />
            </button>
            <span className="flex-1 text-center font-mono text-2xl font-bold text-[#1d2b1f]" aria-live="polite">
              {qty}x
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(999, q + 1))}
              aria-label="Tambah jumlah"
              className="neu-press grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff8f0] text-[#4a5e3a] shadow-[var(--neu-out)]"
            >
              <Plus size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-xs text-[#4a5e3a]">{formatRupiah(keyData.price)} × {qty} = {formatRupiah(basePrice)}</p>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Gacha Key" />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-[#1d2b1f] hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="sm" onClick={handleQris} disabled={!playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>
            {playerNick ? (
              'Mulai Pembayaran'
            ) : (
              <>
                <Lock size={13} aria-hidden="true" /> Login dulu untuk order
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
    <BetaPaymentModal
      open={betaOpen}
      onClose={() => setBetaOpen(false)}
      productLabel={`${keyData.name} ×${qty}`}
      orderPayload={{ type: 'key', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { keyName: keyData.key.toLowerCase(), qty, discountPct: discount } }}
    />
    </>
  );
}

export function GachaKeysTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);

  return (
    <>
      <p className="mb-4 text-center text-xs text-[#5a7048]">
        Tampil dari harga tertinggi — semakin ke bawah semakin terjangkau
      </p>
      <div className="neu-grid neu-grid-3">
        {KEYS_DESC.map((k, idx) => {
          const tier = KEY_TIER[idx] ?? KEY_TIER[4];
          const tone = KEY_ACCENT[k.key] || 'neon-400';

          return (
            <article
              key={k.key}
              className={cn(
                'group relative flex flex-col rounded-[var(--radius-neu-xl)] p-6',
                'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))]',
                tier.elevation,
                'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                'hover:-translate-y-[3px] hover:shadow-[var(--neu-out-lg)]'
              )}
              style={{ '--accent': `var(--color-${tone})` }}
              data-aos="fade-up"
              data-aos-delay={idx * 50}
            >
              {/* Accent bar replaces the hairline shimmer */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-3.5 h-1 w-11 -translate-x-1/2 rounded-full"
                style={{ background: 'var(--accent)', opacity: 0.9 }}
              />

              <div className="flex flex-col items-center gap-3 pt-3 text-center">
                {(tier.badge || k.badge) && (
                  <Badge tone={tier.badgeTone ?? 'neon'}>{tier.badge ?? k.badge}</Badge>
                )}

                <span className="neu-icon h-14 w-14 rounded-full" style={{ color: 'var(--accent)' }}>
                  <Icon name={k.icon} size={24} />
                </span>

                <div>
                  <h3 className="font-display text-base font-extrabold text-[#1d2b1f]">{k.name}</h3>
                  <p className={cn('font-mono font-bold text-[#1d2b1f]', tier.priceSize)}>
                    {formatRupiah(k.price)}
                    <span className="text-xs font-normal text-[#4a5e3a]"> / key</span>
                  </p>
                </div>

                <p className="flex-1 text-xs leading-relaxed text-[#4a5e3a]">{k.description}</p>

                <Button
                  fullWidth
                  variant={tier.featured ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => nick && setSelected(k)}
                  disabled={!nick}
                  title={!nick ? 'Login dulu untuk order' : undefined}
                  className="mt-1"
                >
                  {nick ? (
                    'Order Sekarang'
                  ) : (
                    <>
                      <Lock size={13} aria-hidden="true" /> Login dulu
                    </>
                  )}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <KeyOrderModal keyData={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

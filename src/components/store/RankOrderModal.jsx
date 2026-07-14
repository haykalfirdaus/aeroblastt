import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { PriceSummary } from './PriceSummary';
import { RANKS, RANK_DURATION_OPTIONS, RANK_ORDER, RANK_PRICES } from '@/data/ranks';
import { SITE } from '@/data/config';
import { buildRankOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
import { formatRupiah } from '@/utils/currency';
// discount check is now done inside DiscountCodeInput via async API
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

export function RankOrderModal({ rank, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState(isBedrock ? 'Bedrock / PE' : '');
  const [ownedRank, setOwnedRank] = useState('none');
  const [duration, setDuration] = useState('permanent');
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);

  if (!rank) return null;

  const durOpt = RANK_DURATION_OPTIONS.find((d) => d.id === duration);
  const ownedPrice = RANK_PRICES[ownedRank === 'none' ? 'NONE' : ownedRank.toUpperCase()] ?? 0;
  const targetPrice = rank.price;
  const upgradeBase = Math.max(0, targetPrice - ownedPrice);
  const basePrice = Math.round(upgradeBase * (durOpt.percentOfBase / 100));
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  const canOrder = ownedRank !== rank.key.toLowerCase() && RANK_ORDER.indexOf(rank.key) > RANK_ORDER.indexOf(ownedRank === 'none' ? 'NONE' : ownedRank.toUpperCase());

  function handleSend() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname kamu!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan terlebih dahulu!', 'error');

    const orderData = {
      nick: (playerNick || nick).trim(), platform,
      target: rank.name.toUpperCase(),
      owned: ownedRank === 'none' ? null : ownedRank,
      duration: durOpt.label,
      discountPct: discount,
      basePrice,
      finalAmount: finalPrice,
      paymentMethod: payment,
    };
    sendInvoice({ type: 'rank', ...orderData });
    openWhatsApp(buildRankOrderMessage(orderData));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Order Rank ${rank.name}`} badge="AEROBLAST STORE" size="md">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />

        <div>
          <FieldLabel required>Nickname Minecraft</FieldLabel>
          <TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Masukkan username in-game kamu'} readOnly={!!playerNick} />
        </div>

        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => !isBedrock && setPlatform(e.target.value)} disabled={isBedrock}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-cyan-400">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>

        <div>
          <FieldLabel>Rank Saat Ini (jika ada — untuk kalkulasi upgrade)</FieldLabel>
          <SelectField value={ownedRank} onChange={(e) => setOwnedRank(e.target.value)}>
            <option value="none">Belum punya rank / Member</option>
            {(() => {
              const targetIdx = RANKS.findIndex((r) => r.key === rank.key);
              return RANKS.map((r, idx) => {
                if (r.key === rank.key) return null;
                const disabled = idx > targetIdx;
                return (
                  <option key={r.key} value={r.key.toLowerCase()} disabled={disabled}>
                    {r.name} ({formatRupiah(r.price)}){disabled ? ' — tidak tersedia' : ''}
                  </option>
                );
              });
            })()}
          </SelectField>
        </div>

        <div>
          <FieldLabel required>Durasi</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {RANK_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDuration(opt.id)}
                className={cn(
                  'rounded-xl border px-3 py-3 text-center transition-all',
                  duration === opt.id ? 'border-neon-400/60 bg-neon-500/15' : 'border-white/10 bg-white/4 hover:border-white/18'
                )}
              >
                {opt.badge && <span className="mb-1 block text-[0.6rem] font-bold text-warning">{opt.badge}</span>}
                <span className="block text-sm font-bold text-text-bright">{opt.label}</span>
                <span className="block text-[0.65rem] text-text-dim">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <DiscountCodeInput onApply={setDiscount} category="Rank" />

        <PriceSummary basePrice={basePrice} discountPercent={discount} />

        <PaymentMethodPicker value={payment} onChange={setPayment} />

        <CheckboxField checked={agreed} onChange={setAgreed}>
          Saya menyetujui <a href="/terms" target="_blank" className="text-neon-300 hover:underline">Syarat &amp; Ketentuan</a> yang berlaku di AeroBlast Network.
        </CheckboxField>

        <Button fullWidth size="sm" onClick={handleSend} disabled={basePrice <= 0 || !playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>
          {playerNick ? 'Order via WhatsApp' : '🔒 Login dulu untuk order'}
        </Button>
      </div>
    </Modal>
  );
}

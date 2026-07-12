import { useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
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
// discount check is done inside DiscountCodeInput via async API
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

const KEY_ACCENT = { BASIC: 'success', VOTE: 'rank-voyager', VIP: 'rank-vortex', LEGEND: 'warning', AEROSPACE: 'cyan-400' };

function KeyOrderModal({ keyData, open, onClose }) {
  const showToast = useToast();
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
    if (!nick.trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: nick.trim(), platform, keyName: keyData.name, qty, discountPct: discount, finalAmount: finalPrice, paymentMethod: payment };
    sendInvoice({ type: 'key', ...orderData });
    openWhatsApp(buildKeyOrderMessage(orderData));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Order ${keyData.name}`} badge="GACHA KEYS">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Username in-game" /></div>
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
        <Button fullWidth size="sm" onClick={handleSend}>Order via WhatsApp</Button>
      </div>
    </Modal>
  );
}

export function GachaKeysTab() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GACHA_KEYS.map((k) => {
          const tone = KEY_ACCENT[k.key] || 'neon-400';
          return (
            <GlassCard key={k.key} interactive>
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                {k.badge && <Badge tone="neon">{k.badge}</Badge>}
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/8 bg-white/4" style={{ boxShadow: `0 0 16px -4px var(--color-${tone})` }}>
                  <Icon name={k.icon} size={22} className={`text-[var(--color-${tone})]`} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-text-bright">{k.name}</h3>
                  <p className="font-mono text-base font-bold text-neon-300">{formatRupiah(k.price)}<span className="text-xs text-text-dim"> / key</span></p>
                </div>
                <p className="text-xs text-text-muted">{k.description}</p>
                <Button fullWidth variant="secondary" size="sm" onClick={() => setSelected(k)}>Order Sekarang</Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
      <KeyOrderModal keyData={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

import { useState } from 'react';
import { Coins } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { PriceSummary } from './PriceSummary';
import { BALANCE_QUICK_PICKS, BALANCE_RATE } from '@/data/balance';
import { SITE } from '@/data/config';
import { buildBalanceOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
import { formatRupiah, formatNumber } from '@/utils/currency';
// discount check is done inside DiscountCodeInput via async API
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

function BalanceOrderModal({ open, onClose, initialRupiah = 0 }) {
  const showToast = useToast();
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState('');
  const [rupiahInput, setRupiahInput] = useState(String(initialRupiah || ''));
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);

  const rupiah = parseInt(rupiahInput) || 0;
  const balance = rupiah * BALANCE_RATE;
  const finalPrice = Math.round(rupiah * (1 - discount / 100));

  function handleSend() {
    if (!nick.trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (rupiah < 5000) return showToast('Minimum pembelian Rp 5.000!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: nick.trim(), platform, balance, discountPct: discount, finalAmount: finalPrice, paymentMethod: payment };
    sendInvoice({ type: 'balance', ...orderData });
    openWhatsApp(buildBalanceOrderMessage(orderData));
  }

  return (
    <Modal open={open} onClose={onClose} title="Top-Up Balance" badge="IN-GAME BALANCE">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div className="rounded-xl border border-neon-500/20 bg-neon-500/8 p-4 text-center">
          <p className="text-xs text-text-dim mb-1">Kurs: Rp 1 = {BALANCE_RATE} Balance</p>
          <p className="font-mono text-2xl font-bold text-neon-300">{formatNumber(balance)} <span className="text-sm font-normal text-text-dim">Balance</span></p>
        </div>
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Username in-game" /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
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
        <PaymentMethodPicker value={payment} onChange={setPayment} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-neon-300 hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
        <Button fullWidth size="sm" onClick={handleSend}>Order via WhatsApp</Button>
      </div>
    </Modal>
  );
}

export function BalanceTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRupiah, setSelectedRupiah] = useState(0);

  function openWith(rupiah) {
    setSelectedRupiah(rupiah);
    setModalOpen(true);
  }

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

          <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-wider text-text-dim">Quick Pick</p>
          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {BALANCE_QUICK_PICKS.map(({ rupiah, popular }) => (
              <button
                key={rupiah}
                type="button"
                onClick={() => openWith(rupiah)}
                className={cn(
                  'relative overflow-hidden rounded-xl border px-4 py-4 text-center transition-all hover:-translate-y-0.5',
                  popular ? 'border-neon-400/40 bg-neon-500/10' : 'border-white/10 bg-white/4 hover:border-white/18'
                )}
              >
                {popular && <span className="absolute right-0 top-0 rounded-bl-lg bg-neon-500 px-2 py-0.5 text-[0.6rem] font-bold text-white">POPULAR</span>}
                <p className="font-mono text-sm font-bold text-text-bright">{formatRupiah(rupiah)}</p>
                <p className="text-[0.65rem] text-text-dim">{formatNumber(rupiah * BALANCE_RATE)} Balance</p>
              </button>
            ))}
          </div>

          <Button fullWidth size="sm" onClick={() => openWith(0)}>Top-Up Custom Amount</Button>
        </GlassCard>
      </div>

      <BalanceOrderModal open={modalOpen} onClose={() => setModalOpen(false)} initialRupiah={selectedRupiah} />
    </>
  );
}

import { useState } from 'react';
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
import { COMMANDS, COMMAND_DURATION_OPTIONS } from '@/data/commands';
import { SITE } from '@/data/config';
import { buildCommandOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { formatRupiah } from '@/utils/currency';
// discount check is done inside DiscountCodeInput via async API
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/cn';

function CommandOrderModal({ cmd, open, onClose }) {
  const showToast = useToast();
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState('');
  const [duration, setDuration] = useState('permanent');
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);

  if (!cmd) return null;
  const durOpt = COMMAND_DURATION_OPTIONS.find((d) => d.id === duration);
  const basePrice = Math.round(cmd.basePrice * (durOpt.percentOfBase / 100));
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleSend() {
    if (!nick.trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    openWhatsApp(buildCommandOrderMessage({ nick: nick.trim(), platform, cmdName: cmd.orderLabel, duration: durOpt.label, discountPct: discount, finalAmount: finalPrice, paymentMethod: payment }));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Order ${cmd.command}`} badge="COMMAND ACCESS">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div>
          <FieldLabel required>Nickname</FieldLabel>
          <TextField value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Username in-game" />
        </div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
        </div>
        <div>
          <FieldLabel required>Durasi</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {COMMAND_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDuration(opt.id)}
                className={cn('rounded-xl border px-3 py-2.5 text-center transition-all', duration === opt.id ? 'border-neon-400/60 bg-neon-500/15' : 'border-white/10 bg-white/4 hover:border-white/18')}
              >
                {opt.badge && <span className="mb-1 block text-[0.6rem] font-bold text-warning">{opt.badge}</span>}
                <span className="block text-xs font-bold text-text-bright">{opt.label}</span>
                <span className="block text-[0.6rem] text-text-dim">{opt.sub}</span>
                <span className="mt-1 block font-mono text-xs font-semibold text-neon-300">{formatRupiah(Math.round(cmd.basePrice * opt.percentOfBase / 100))}</span>
              </button>
            ))}
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <PaymentMethodPicker value={payment} onChange={setPayment} />
        <CheckboxField checked={agreed} onChange={setAgreed}>
          Saya menyetujui <a href="/terms" target="_blank" className="text-neon-300 hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.
        </CheckboxField>
        <Button fullWidth size="sm" onClick={handleSend}>Order via WhatsApp</Button>
      </div>
    </Modal>
  );
}

export function CommandsTab() {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COMMANDS.map((cmd) => (
          <GlassCard key={cmd.key} interactive>
            <div className="flex flex-col gap-2.5 p-4">
              {cmd.bundleTag && <Badge tone="cyan">{cmd.bundleTag}</Badge>}
              {cmd.badge && <Badge tone="gold">{cmd.badge}</Badge>}
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-neon-500/18 bg-neon-500/6">
                  <Icon name={cmd.icon} size={17} className="text-neon-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-text-bright truncate">{cmd.command}</p>
                  <p className="text-[0.65rem] text-text-dim">{cmd.name}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-[0.7rem] leading-relaxed text-text-muted">{cmd.description}</p>
              {cmd.bundleItems && (
                <div className="flex flex-wrap gap-1">
                  {cmd.bundleItems.map((b) => (
                    <span key={b} className="rounded-full border border-cyan-500/18 bg-cyan-500/6 px-1.5 py-0.5 text-[0.6rem] text-cyan-300">{b}</span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-1">
                <p className="mb-1.5 font-mono text-sm font-bold text-neon-300">{formatRupiah(cmd.basePrice)}</p>
                <Button fullWidth variant="secondary" size="sm" onClick={() => setSelected(cmd)}>Order</Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      <CommandOrderModal cmd={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

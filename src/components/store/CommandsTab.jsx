import { useState } from 'react';
import { Lock } from 'lucide-react';
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
import { sendInvoice } from '@/utils/invoice';
import { createBetaOrder } from '@/utils/betaPayment';
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// Sort highest basePrice first (anchoring)
const COMMANDS_DESC = [...COMMANDS].sort((a, b) => b.basePrice - a.basePrice);

// Map sorted index → tier style
function getTier(idx, total) {
  const topCount = Math.ceil(total * 0.4); // top 40% = featured
  const featured = idx < topCount;
  const isTop = idx === 0;
  return {
    featured,
    isTop,
    priceSize: isTop ? 'text-base' : featured ? 'text-sm' : 'text-xs',
    opacity: featured ? '' : idx >= topCount + 2 ? 'opacity-70' : 'opacity-85',
    glow: featured,
  };
}

function CommandOrderModal({ cmd, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState(isBedrock ? 'Bedrock / PE' : '');
  const [duration, setDuration] = useState('permanent');
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [waLoading, setWaLoading] = useState(false);

  if (!cmd) return null;
  const durOpt = COMMAND_DURATION_OPTIONS.find((d) => d.id === duration);
  const basePrice = Math.round(cmd.basePrice * (durOpt.percentOfBase / 100));
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  async function handleSend() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: (playerNick || nick).trim(), platform, cmdName: cmd.orderLabel, duration: durOpt.label, discountPct: discount, finalAmount: finalPrice, paymentMethod: payment };
    setWaLoading(true);
    try {
      const betaOrder = await createBetaOrder({ type: 'command', nick: orderData.nick, platform, baseAmount: finalPrice, details: { cmdName: cmd.orderLabel, duration: durOpt.id } });
      openWhatsApp(buildCommandOrderMessage({ ...orderData, uniqueAmount: betaOrder.totalAmount }));
    } catch {
      sendInvoice({ type: 'command', ...orderData });
      openWhatsApp(buildCommandOrderMessage(orderData));
    } finally {
      setWaLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Order ${cmd.command}`} badge="COMMAND ACCESS">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div>
          <FieldLabel required>Nickname</FieldLabel>
          <TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} />
        </div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => !isBedrock && setPlatform(e.target.value)} disabled={isBedrock}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-cyan-400">Terdeteksi Bedrock — platform dikunci otomatis</p>}
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
        <Button fullWidth size="sm" onClick={handleSend} disabled={!playerNick || waLoading} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>{waLoading ? 'Menyiapkan order...' : playerNick ? 'Order via WhatsApp' : '🔒 Login dulu untuk order'}</Button>
      </div>
    </Modal>
  );
}

export function CommandsTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);
  const total = COMMANDS_DESC.length;

  return (
    <>
      <p className="mb-4 text-center text-xs text-text-faint">
        Tampil dari harga tertinggi — semakin ke bawah semakin terjangkau
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COMMANDS_DESC.map((cmd, idx) => {
          const tier = getTier(idx, total);

          return (
            <div
              key={cmd.key}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200',
                tier.featured
                  ? 'border-neon-500/20 bg-white/[0.03] hover:scale-[1.015] hover:brightness-110'
                  : 'border-white/8 bg-white/[0.015] hover:scale-[1.01]',
                tier.opacity,
              )}
            >
              {/* top shimmer */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--color-neon-500), transparent)', opacity: tier.featured ? 0.5 : 0.15 }}
              />

              <div className="flex flex-col gap-2.5 p-4">
                {cmd.bundleTag && <Badge tone="cyan">{cmd.bundleTag}</Badge>}
                {cmd.badge && <Badge tone={tier.isTop ? 'gold' : 'neon'}>{cmd.badge}</Badge>}

                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
                    tier.featured ? 'border-neon-500/25 bg-neon-500/10' : 'border-white/8 bg-white/4',
                  )}>
                    <Icon
                      name={cmd.icon}
                      size={17}
                      className={cn(tier.featured ? 'text-neon-300' : 'text-text-dim')}
                      style={tier.glow ? { filter: 'drop-shadow(0 0 6px var(--color-neon-400))' } : undefined}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('font-mono text-xs font-bold truncate', tier.featured ? 'text-text-bright' : 'text-text-muted')}>
                      {cmd.command}
                    </p>
                    <p className="text-[0.65rem] text-text-dim">{cmd.name}</p>
                  </div>
                </div>

                <p className={cn('line-clamp-2 text-[0.7rem] leading-relaxed', tier.featured ? 'text-text-muted' : 'text-text-faint')}>
                  {cmd.description}
                </p>

                {cmd.bundleItems && (
                  <div className="flex flex-wrap gap-1">
                    {cmd.bundleItems.map((b) => (
                      <span key={b} className="rounded-full border border-cyan-500/18 bg-cyan-500/6 px-1.5 py-0.5 text-[0.6rem] text-cyan-300">{b}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-1">
                  <p className={cn('mb-1.5 font-mono font-bold text-neon-300', tier.priceSize, !tier.featured && 'opacity-75')}>
                    {formatRupiah(cmd.basePrice)}
                  </p>
                  <Button
                    fullWidth
                    variant={tier.featured ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => nick && setSelected(cmd)}
                    disabled={!nick}
                    title={!nick ? 'Login dulu untuk order' : undefined}
                    className={!tier.featured ? 'opacity-75' : ''}
                  >
                    {nick ? 'Order' : <><Lock size={12} className="inline mr-1" />Login dulu</>}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <CommandOrderModal cmd={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

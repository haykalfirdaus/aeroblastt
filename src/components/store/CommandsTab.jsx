'use client';
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
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { COMMANDS, COMMAND_DURATION_OPTIONS } from '@/data/commands';
import { SITE } from '@/data/config';
import { buildCommandOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
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
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);

  if (!cmd) return null;
  const durOpt = COMMAND_DURATION_OPTIONS.find((d) => d.id === duration);
  const basePrice = Math.round(cmd.basePrice * (durOpt.percentOfBase / 100));
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
    const orderData = { nick: (playerNick || nick).trim(), platform, cmdName: cmd.orderLabel, duration: durOpt.label, discountPct: discount, finalAmount: finalPrice, paymentMethod: 'Transfer / QRIS' };
    setWaLoading(true);
    sendInvoice({ type: 'command', ...orderData });
    openWhatsApp(buildCommandOrderMessage(orderData));
    setWaLoading(false);
  }

  return (
    <>
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
          {isBedrock && <p className="mt-1 text-[11px] text-[#566947]">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>
        <div>
          <FieldLabel required>Durasi</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {COMMAND_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDuration(opt.id)}
                className={cn('rounded-xl border px-3 py-2.5 text-center transition-all', duration === opt.id ? 'border-[#B4E035]/60 bg-[#B4E035]/15' : 'border-[#D8D1C0] bg-[#F0EBE0] hover:border-[#B4E035]/25')}
              >
                {opt.badge && <span className="mb-1 block text-[0.6rem] font-bold text-warning">{opt.badge}</span>}
                <span className="block text-xs font-bold text-[#1A2E1A]">{opt.label}</span>
                <span className="block text-[0.6rem] text-[#6B7F5A]">{opt.sub}</span>
                <span className="mt-1 block font-mono text-xs font-semibold text-[#748F1C]">{formatRupiah(Math.round(cmd.basePrice * opt.percentOfBase / 100))}</span>
              </button>
            ))}
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <CheckboxField checked={agreed} onChange={setAgreed}>
          Saya menyetujui <a href="/terms" target="_blank" className="text-[#748F1C] hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.
        </CheckboxField>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="sm" onClick={handleQris} disabled={!playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>
            {playerNick ? '⚡ Bayar via QRIS Otomatis' : '🔒 Login dulu untuk order'}
          </Button>
          {playerNick && (
            <button type="button" onClick={handleWa} disabled={waLoading} className="w-full rounded-xl border border-[#D8D1C0] bg-[#F5F2EA] py-2.5 text-sm font-semibold text-[#6B7F5A] transition-all hover:border-[#B4E035]/30 hover:text-[#1A2E1A]">
              Lanjut via WhatsApp (Manual)
            </button>
          )}
        </div>
      </div>
    </Modal>
    <BetaPaymentModal
      open={betaOpen}
      onClose={() => setBetaOpen(false)}
      productLabel={`${cmd.command} (${durOpt.label})`}
      orderPayload={{ type: 'command', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { cmdName: cmd.orderLabel, duration: durOpt.id } }}
    />
    </>
  );
}

export function CommandsTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);
  const total = COMMANDS_DESC.length;

  return (
    <>
      <p className="mb-4 text-center text-xs text-[#8A9E7A]">
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
                  ? 'border-[#D8D1C0] bg-[#F5F2EA] hover:scale-[1.015] hover:brightness-[1.02]'
                  : 'border-[#D8D1C0]/60 bg-[#FAFAF7] hover:scale-[1.01]',
                tier.opacity,
              )}
            >
              {/* top shimmer */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #B4E035, transparent)', opacity: tier.featured ? 0.5 : 0.15 }}
              />

              <div className="flex flex-col gap-2.5 p-4">
                {cmd.bundleTag && <Badge tone="cyan">{cmd.bundleTag}</Badge>}
                {cmd.badge && <Badge tone={tier.isTop ? 'gold' : 'neon'}>{cmd.badge}</Badge>}

                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl border',
                    tier.featured ? 'border-[#B4E035]/25 bg-[#B4E035]/10' : 'border-[#D8D1C0] bg-[#F0EBE0]',
                  )}>
                    <Icon
                      name={cmd.icon}
                      size={17}
                      className={cn(tier.featured ? 'text-[#748F1C]' : 'text-[#6B7F5A]')}
                      style={tier.glow ? { filter: 'drop-shadow(0 0 6px #B4E035)' } : undefined}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('font-mono text-xs font-bold truncate', tier.featured ? 'text-[#1A2E1A]' : 'text-[#4A5E3E]')}>
                      {cmd.command}
                    </p>
                    <p className="text-[0.65rem] text-[#6B7F5A]">{cmd.name}</p>
                  </div>
                </div>

                <p className={cn('line-clamp-2 text-[0.7rem] leading-relaxed', tier.featured ? 'text-[#4A5E3E]' : 'text-[#8A9E7A]')}>
                  {cmd.description}
                </p>

                {cmd.bundleItems && (
                  <div className="flex flex-wrap gap-1">
                    {cmd.bundleItems.map((b) => (
                      <span key={b} className="rounded-full border border-[#6B7F5A]/25 bg-[#6B7F5A]/8 px-1.5 py-0.5 text-[0.6rem] text-[#566947]">{b}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-1">
                  <p className={cn('mb-1.5 font-mono font-bold text-[#748F1C]', tier.priceSize, !tier.featured && 'opacity-75')}>
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

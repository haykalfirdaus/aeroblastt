'use client';
import { useState } from 'react';
import { ChevronRight, Lock, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { SKILL_CATEGORIES, SKILL_DEFAULT_LEVELS, SKILL_MAX_LEVEL } from '@/data/skills';
import { SITE } from '@/data/config';
import { buildSkillOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// Sort categories highest pricePerLevel first (anchoring)
const CATS_DESC = [...SKILL_CATEGORIES].sort((a, b) => b.pricePerLevel - a.pricePerLevel);

// Category accent colors by index in sorted order
const CAT_STYLES = [
  { border: 'border-rank-ravest/25', label: 'text-rank-ravest', badge: 'PREMIUM', badgeTone: 'gold', featured: true },
  { border: 'border-rank-vortex/20', label: 'text-rank-vortex', badge: null, featured: true },
  { border: 'border-[#D8D1C0]',      label: 'text-[#4A5E3E]',  badge: 'STARTER', badgeTone: 'dim', featured: false },
];

function SkillOrderModal({ skill, cat, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState(isBedrock ? 'Bedrock / PE' : '');
  const [levels, setLevels] = useState(SKILL_DEFAULT_LEVELS);
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);

  if (!skill || !cat) return null;
  const basePrice = cat.pricePerLevel * levels;
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
    const orderData = { nick: (playerNick || nick).trim(), platform, skillName: skill.name, levels, discountPct: discount, finalAmount: finalPrice, paymentMethod: 'Transfer / QRIS' };
    setWaLoading(true);
    sendInvoice({ type: 'skill', ...orderData });
    openWhatsApp(buildSkillOrderMessage(orderData));
    setWaLoading(false);
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title={`Boost Skill ${skill.name}`} badge="SKILL BOOST">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => !isBedrock && setPlatform(e.target.value)} disabled={isBedrock}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-[#566947]">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>
        <div>
          <FieldLabel required>Jumlah Level ({formatRupiah(cat.pricePerLevel)}/level)</FieldLabel>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setLevels((l) => Math.max(1, l - 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D8D1C0] bg-[#F0EBE0] text-[#4A5E3E] hover:border-[#B4E035]/30 hover:bg-[#E8E2D5] transition"><Minus size={16} /></button>
            <span className="flex-1 text-center font-mono text-2xl font-bold text-[#1A2E1A]">{levels}</span>
            <button type="button" onClick={() => setLevels((l) => Math.min(SKILL_MAX_LEVEL, l + 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#D8D1C0] bg-[#F0EBE0] text-[#4A5E3E] hover:border-[#B4E035]/30 hover:bg-[#E8E2D5] transition"><Plus size={16} /></button>
          </div>
          <p className="mt-1.5 text-center text-xs text-[#6B7F5A]">{formatRupiah(cat.pricePerLevel)} × {levels} level = {formatRupiah(basePrice)}</p>
          <div className="mt-2">
            <label className="text-[0.65rem] text-[#6B7F5A] uppercase tracking-wide mb-1 block">Quick Pick</label>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 20, 50, 100].map((n) => (
                <button key={n} type="button" onClick={() => setLevels(n)} className={`rounded-lg border px-3 py-1 text-xs font-mono transition ${levels === n ? 'border-[#B4E035]/60 bg-[#B4E035]/15 text-[#748F1C]' : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] hover:border-[#B4E035]/30'}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Skill Boost" />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-[#748F1C] hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
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
      productLabel={`${skill.name} ×${levels} Level`}
      orderPayload={{ type: 'skill', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { skillName: skill.name, levels } }}
    />
    </>
  );
}

export function SkillBoostTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);

  return (
    <>
      <p className="mb-5 text-center text-xs text-[#8A9E7A]">
        Tampil dari harga tertinggi per level — semakin ke bawah semakin terjangkau
      </p>

      <div className="flex flex-col gap-6">
        {CATS_DESC.map((cat, catIdx) => {
          const style = CAT_STYLES[catIdx] ?? CAT_STYLES[2];

          return (
            <div
              key={cat.id}
              className={cn(
                'overflow-hidden rounded-xl border',
                style.border,
                style.featured ? 'bg-[#F5F2EA]' : 'bg-[#FAFAF7] opacity-85',
              )}
              style={{ animation: 'page-wipe-in 0.5s cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${catIdx * 100}ms` }}
            >
              {/* Category header */}
              <div className={cn(
                'flex items-center justify-between px-4 py-3 border-b',
                style.featured ? 'border-[#D8D1C0] bg-[#EDE8DA]' : 'border-[#D8D1C0]/50',
              )}>
                <div className="flex items-center gap-2">
                  {style.badge && (
                    <span className={cn(
                      'rounded-full border px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-wider',
                      style.badgeTone === 'gold'
                        ? 'border-warning/30 bg-warning/10 text-warning'
                        : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A]',
                    )}>
                      {style.badge}
                    </span>
                  )}
                  <h3 className={cn('font-display text-sm font-bold', style.label)}>
                    {cat.label}
                  </h3>
                </div>
                <span className={cn('font-mono text-xs font-semibold', style.featured ? 'text-[#748F1C]' : 'text-[#6B7F5A] opacity-70')}>
                  {formatRupiah(cat.pricePerLevel)}/level
                </span>
              </div>

              {/* Skills grid */}
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className={cn(
                      'rounded-xl border p-4 transition-all duration-200',
                      style.featured
                        ? 'border-[#D8D1C0] bg-[#FAFAF7] hover:scale-[1.015] hover:brightness-[1.02]'
                        : 'border-[#D8D1C0]/60 bg-[#FAF8F4] hover:scale-[1.01]',
                    )}
                  >
                    <div className="mb-3">
                      <h4 className={cn('font-bold text-sm', style.featured ? 'text-[#1A2E1A]' : 'text-[#4A5E3E]')}>
                        {skill.name}
                      </h4>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {skill.abilities.map((a) => (
                        <span
                          key={a}
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[0.65rem]',
                            style.featured
                              ? 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A]'
                              : 'border-[#D8D1C0]/60 bg-[#F5F2EA] text-[#8A9E7A]',
                          )}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <Button
                      fullWidth
                      variant={style.featured ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => nick && setSelected({ skill, cat })}
                      disabled={!nick}
                      title={!nick ? 'Login dulu untuk order' : undefined}
                      className={!style.featured ? 'opacity-75' : ''}
                    >
                      {nick ? <><ChevronRight size={14} /> Boost Skill</> : <><Lock size={12} className="inline mr-1" />Login dulu</>}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <SkillOrderModal skill={selected?.skill} cat={selected?.cat} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

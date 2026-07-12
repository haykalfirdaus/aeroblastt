import { useState } from 'react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { PriceSummary } from './PriceSummary';
import { SKILL_CATEGORIES, SKILL_DEFAULT_LEVELS, SKILL_MAX_LEVEL } from '@/data/skills';
import { SITE } from '@/data/config';
import { buildSkillOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
// discount check is done inside DiscountCodeInput via async API
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';

function SkillOrderModal({ skill, cat, open, onClose }) {
  const showToast = useToast();
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState('');
  const [levels, setLevels] = useState(SKILL_DEFAULT_LEVELS);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);

  if (!skill || !cat) return null;
  const basePrice = cat.pricePerLevel * levels;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleSend() {
    if (!nick.trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: nick.trim(), platform, skillName: skill.name, levels, discountPct: discount, finalAmount: finalPrice, paymentMethod: payment };
    sendInvoice({ type: 'skill', ...orderData });
    openWhatsApp(buildSkillOrderMessage(orderData));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Boost Skill ${skill.name}`} badge="SKILL BOOST">
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
          <FieldLabel required>Jumlah Level ({formatRupiah(cat.pricePerLevel)}/level)</FieldLabel>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setLevels((l) => Math.max(1, l - 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/5 text-text-muted hover:bg-white/10 transition"><Minus size={16} /></button>
            <span className="flex-1 text-center font-mono text-2xl font-bold text-text-bright">{levels}</span>
            <button type="button" onClick={() => setLevels((l) => Math.min(SKILL_MAX_LEVEL, l + 1))} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/5 text-text-muted hover:bg-white/10 transition"><Plus size={16} /></button>
          </div>
          <p className="mt-1.5 text-center text-xs text-text-dim">{formatRupiah(cat.pricePerLevel)} × {levels} level = {formatRupiah(basePrice)}</p>
          <div className="mt-2">
            <label className="text-[0.65rem] text-text-dim uppercase tracking-wide mb-1 block">Quick Pick</label>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 20, 50, 100].map((n) => (
                <button key={n} type="button" onClick={() => setLevels(n)} className={`rounded-lg border px-3 py-1 text-xs font-mono transition ${levels === n ? 'border-neon-400/60 bg-neon-500/15 text-neon-300' : 'border-white/10 bg-white/4 text-text-dim hover:border-white/20'}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Skill Boost" />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <PaymentMethodPicker value={payment} onChange={setPayment} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-neon-300 hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
        <Button fullWidth size="sm" onClick={handleSend}>Order via WhatsApp</Button>
      </div>
    </Modal>
  );
}

export function SkillBoostTab() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="flex flex-col gap-8">
        {SKILL_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-text-bright">{cat.label}</h3>
              <span className="ml-auto font-mono text-xs text-neon-300">{formatRupiah(cat.pricePerLevel)}/level</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.skills.map((skill) => (
                <GlassCard key={skill.name} interactive>
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h4 className="font-bold text-sm text-text-bright">{skill.name}</h4>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {skill.abilities.map((a) => (
                        <span key={a} className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[0.65rem] text-text-dim">{a}</span>
                      ))}
                    </div>
                    <Button fullWidth variant="secondary" size="sm" onClick={() => setSelected({ skill, cat })}>
                      <ChevronRight size={14} /> Boost Skill
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>
      <SkillOrderModal skill={selected?.skill} cat={selected?.cat} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}

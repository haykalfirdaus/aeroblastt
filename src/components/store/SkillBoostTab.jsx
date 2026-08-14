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
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// Sort categories highest pricePerLevel first (anchoring)
const CATS_DESC = [...SKILL_CATEGORIES].sort((a, b) => b.pricePerLevel - a.pricePerLevel);

/*
 * Category tiers separate by ELEVATION rather than borders + opacity: a faded
 * category read as disabled rather than as merely cheaper.
 */
const CAT_STYLES = [
  { elevation: 'shadow-[var(--neu-out-lg)]', accent: 'var(--color-rank-ravest)', badge: 'PREMIUM', featured: true },
  { elevation: 'shadow-[var(--neu-out-lg)]', accent: 'var(--color-rank-vortex)', badge: null, featured: true },
  { elevation: 'shadow-[var(--neu-out)]', accent: 'var(--color-neon-400, #BFFF5E)', badge: 'STARTER', featured: false },
];

function SkillOrderModal({ skill, cat, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const platform = isBedrock ? 'Bedrock / PE' : 'Java Edition';
  const [levels, setLevels] = useState(SKILL_DEFAULT_LEVELS);
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);

  if (!skill || !cat) return null;
  const basePrice = cat.pricePerLevel * levels;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleQris() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    setBetaOpen(true);
  }


  return (
    <>
    <Modal open={open} onClose={onClose} title={`Boost Skill ${skill.name}`} badge="SKILL BOOST">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          {/*
            Read-only. Platform comes from the logged-in nickname — a dot means
            Bedrock — so letting the player choose a different one only ever
            produced a mismatched order. The value still flows into the payload
            exactly as before.
          */}
          <div className="flex min-h-[52px] items-center rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 shadow-[var(--neu-in)]">
            <span className="text-sm font-semibold text-[#1d2b1f]">{platform}</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#4a5e3a]">Terdeteksi otomatis dari nickname kamu</p>
        </div>
        <div>
          <FieldLabel required>Jumlah Level ({formatRupiah(cat.pricePerLevel)}/level)</FieldLabel>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLevels((l) => Math.max(1, l - 1))}
              aria-label="Kurangi level"
              className="neu-press grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff8f0] text-[#4a5e3a] shadow-[var(--neu-out)]"
            >
              <Minus size={17} aria-hidden="true" />
            </button>
            <span className="flex-1 text-center font-mono text-2xl font-bold text-[#1d2b1f]" aria-live="polite">{levels}</span>
            <button
              type="button"
              onClick={() => setLevels((l) => Math.min(SKILL_MAX_LEVEL, l + 1))}
              aria-label="Tambah level"
              className="neu-press grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff8f0] text-[#4a5e3a] shadow-[var(--neu-out)]"
            >
              <Plus size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-xs text-[#4a5e3a]">{formatRupiah(cat.pricePerLevel)} × {levels} level = {formatRupiah(basePrice)}</p>
          <div className="mt-2">
            <label className="text-[0.65rem] text-[#4a5e3a] uppercase tracking-wide mb-1 block">Quick Pick</label>
            <div className="flex flex-wrap gap-1.5">
              {[5, 10, 20, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLevels(n)}
                  className={cn(
                    'min-h-[48px] min-w-[48px] rounded-[var(--radius-neu)] px-4 font-mono text-xs font-bold text-[#1d2b1f]',
                    'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                    levels === n
                      ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                      : 'neu-press bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Skill Boost" />
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
      productLabel={`${skill.name} ×${levels} Level`}
      orderPayload={{ type: 'skill', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { skillName: skill.name, skillCategory: cat.id, levels, discountPct: discount } }}
    />
    </>
  );
}

export function SkillBoostTab() {
  const { nick } = usePlayerAuth();
  const [selected, setSelected] = useState(null);

  return (
    <>

      <div className="flex flex-col gap-6">
        {CATS_DESC.map((cat, catIdx) => {
          const style = CAT_STYLES[catIdx] ?? CAT_STYLES[2];

          return (
            <div
              key={cat.id}
              className={cn(
                'relative rounded-[var(--radius-neu-xl)] p-5 sm:p-6',
                'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))]',
                style.elevation,
              )}
              data-aos="fade-up"
              data-aos-delay={catIdx * 60}
              data-aos-duration="500"
            >
              {/* Category accent bar */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-3.5 h-1 w-11 -translate-x-1/2 rounded-full"
                style={{ background: style.accent, opacity: 0.9 }}
              />

              {/* Category header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-2.5">
                  {style.badge && <span className="neu-chip">{style.badge}</span>}
                  <h3 className="font-display text-sm font-bold text-[#1d2b1f]">
                    {cat.label}
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold text-[#1d2b1f]">
                  {formatRupiah(cat.pricePerLevel)}/level
                </span>
              </div>

              <div className="neu-rule my-5" />

              {/* Skills grid */}
              <div className="neu-grid neu-grid-3">
                {cat.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className={cn(
                      'rounded-[var(--radius-neu-lg)] p-4',
                      'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]',
                      'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                      'hover:-translate-y-[3px] hover:shadow-[var(--neu-out-lg)]',
                    )}
                  >
                    <div className="mb-3">
                      <h4 className="text-sm font-bold text-[#1d2b1f]">
                        {skill.name}
                      </h4>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {skill.abilities.map((a) => (
                        <span key={a} className="neu-tag">
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
                    >
                      {nick ? <><ChevronRight size={14} aria-hidden="true" /> Boost Skill</> : <><Lock size={13} aria-hidden="true" /> Login dulu</>}
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

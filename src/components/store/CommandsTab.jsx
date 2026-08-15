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
import { AgreeVerify } from './AgreeVerify';
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { COMMANDS, COMMAND_DURATION_OPTIONS, isCommandOwnedByRank } from '@/data/commands';
import { usePlayerRank } from '@/hooks/usePlayerRank';
import { SITE } from '@/data/config';
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
    // Tiers are separated by ELEVATION, not opacity — dimmed text fails contrast.
    elevation: featured ? 'shadow-[var(--neu-out-lg)]' : 'shadow-[var(--neu-out)]',
  };
}

function CommandOrderModal({ cmd, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const platform = isBedrock ? 'Bedrock / PE' : 'Java Edition';
  const [duration, setDuration] = useState('permanent');
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);

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
          <FieldLabel required>Durasi</FieldLabel>
          <div className="grid grid-cols-3 gap-2.5">
            {COMMAND_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDuration(opt.id)}
                className={cn(
                  'min-h-[48px] rounded-[var(--radius-neu)] px-3 py-2.5 text-center',
                  'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                  duration === opt.id
                    ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                    : 'neu-press bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]'
                )}
              >
                {opt.badge && <span className="mb-1 block text-[0.6rem] font-bold text-warning">{opt.badge}</span>}
                <span className="block text-xs font-bold text-[#1d2b1f]">{opt.label}</span>
                <span className="block text-[0.6rem] text-[#4a5e3a]">{opt.sub}</span>
                <span className="mt-1 block font-mono text-xs font-semibold text-[#1d2b1f]">{formatRupiah(Math.round(cmd.basePrice * opt.percentOfBase / 100))}</span>
              </button>
            ))}
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Command" />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <AgreeVerify checked={agreed} onChange={(ok) => setAgreed(ok)} />
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
      productLabel={`${cmd.command} (${durOpt.label})`}
      orderPayload={{ type: 'command', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { cmdName: cmd.key, duration: durOpt.id, discountPct: discount } }}
    />
    </>
  );
}

export function CommandsTab() {
  const { nick } = usePlayerAuth();
  const { rank: playerRank } = usePlayerRank();
  const [selected, setSelected] = useState(null);
  const total = COMMANDS_DESC.length;

  return (
    <>
      <div className="neu-grid neu-grid-4">
        {COMMANDS_DESC.map((cmd, idx) => {
          const tier = getTier(idx, total);
          const ownedByRank = isCommandOwnedByRank(cmd, playerRank);

          return (
            <div
              key={cmd.key}
              className={cn(
                'group relative flex flex-col rounded-[var(--radius-neu-xl)]',
                // Owned commands are carved in ("already yours") instead of faded out.
                ownedByRank
                  ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                  : cn(
                      'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))]',
                      tier.elevation,
                      'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                      'hover:-translate-y-[3px] hover:shadow-[var(--neu-out-lg)]',
                    ),
              )}
              data-aos="fade-up"
              data-aos-delay={idx * 40}
              data-aos-duration="500"
            >
              {/* Accent bar replaces the hairline shimmer */}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-3.5 h-1 w-11 -translate-x-1/2 rounded-full"
                style={{ background: 'var(--color-neon-400, #BFFF5E)', opacity: ownedByRank ? 0.35 : 0.9 }}
              />

              {/*
                `flex-1` is what makes the `mt-auto` further down actually work:
                the inner column must fill the card's height before it can push
                the price/CTA to the bottom. Without it, cards carrying a badge
                or bundle tag put their button at a different height than cards
                without one.

                The badge row is height-reserved for the same reason — optional
                content must not shift where the rest of the card begins.
              */}
              <div className="flex flex-1 flex-col gap-2.5 p-5 pt-7">
                <div className="flex min-h-[26px] flex-wrap items-start gap-1.5">
                  {ownedByRank && <Badge tone="neon">SUDAH DIMILIKI</Badge>}
                  {cmd.bundleTag && <Badge tone="cyan">{cmd.bundleTag}</Badge>}
                  {cmd.badge && <Badge tone={tier.isTop ? 'gold' : 'neon'}>{cmd.badge}</Badge>}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="neu-icon h-11 w-11 rounded-[14px] shrink-0 text-[#1d2b1f]">
                    <Icon name={cmd.icon} size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-bold text-[#1d2b1f]">
                      {cmd.command}
                    </p>
                    <p className="text-[0.65rem] text-[#4a5e3a]">{cmd.name}</p>
                  </div>
                </div>

                {/* Two-line box: a 1-line description must not raise the CTA. */}
                <p className="line-clamp-2 min-h-[2.4rem] text-[0.7rem] leading-relaxed text-[#4a5e3a]">
                  {cmd.description}
                </p>

                {cmd.bundleItems && (
                  <div className="flex flex-wrap gap-1.5">
                    {cmd.bundleItems.map((b) => (
                      <span key={b} className="neu-tag">{b}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-1">
                  <p className={cn('mb-2 font-mono font-bold text-[#1d2b1f]', tier.priceSize)}>
                    {formatRupiah(cmd.basePrice)}
                  </p>
                  <Button
                    fullWidth
                    variant={tier.featured ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => nick && !ownedByRank && setSelected(cmd)}
                    disabled={!nick || ownedByRank}
                    title={
                      ownedByRank
                        ? `Sudah termasuk benefit rank ${cmd.includedInRank}`
                        : !nick ? 'Login dulu untuk order' : undefined
                    }
                  >
                    {ownedByRank
                      ? <><Lock size={13} aria-hidden="true" /> Termasuk rank kamu</>
                      : nick ? 'Order' : <><Lock size={13} aria-hidden="true" /> Login dulu</>}
                  </Button>
                  {ownedByRank && (
                    <p className="mt-1.5 text-center text-[0.6rem] text-[#4a5e3a]">
                      Sudah kamu dapat dari rank {cmd.includedInRank}
                    </p>
                  )}
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

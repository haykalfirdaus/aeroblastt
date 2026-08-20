'use client';
import { useEffect, useState } from 'react';
import { LandPlot, Lock } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FieldLabel, TextField } from '@/components/ui/FormFields';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { AgreeVerify } from './AgreeVerify';
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { CLAIM_QUICK_PICKS, CLAIM_RATE } from '@/data/claims';
import { formatRupiah, formatNumber } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { cn } from '@/lib/cn';

// Sort highest rupiah first (anchoring)
const PICKS_DESC = [...CLAIM_QUICK_PICKS].sort((a, b) => b.rupiah - a.rupiah);

function ClaimOrderModal({ open, onClose, initialRupiah = 0 }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const platform = isBedrock ? 'Bedrock / PE' : 'Java Edition';
  const [rupiahInput, setRupiahInput] = useState(String(initialRupiah || ''));
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);

  const rupiah = parseInt(rupiahInput) || 0;
  const claims = rupiah * CLAIM_RATE;
  const finalPrice = Math.round(rupiah * (1 - discount / 100));

  function handleQris() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (rupiah < 5000) return showToast('Minimum pembelian Rp 5.000!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    setBetaOpen(true);
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title="Beli Claim Limit" badge="CLAIM LIMIT">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 text-center shadow-[var(--neu-in)]">
          <p className="text-xs text-[#4a5e3a] mb-1">Kurs: Rp 1 = {CLAIM_RATE} Claim Limit</p>
          <p className="font-mono text-2xl font-bold text-[#1d2b1f]">{formatNumber(claims)} <span className="text-sm font-normal text-[#4a5e3a]">Claim Limit</span></p>
        </div>
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <div className="flex min-h-[52px] items-center rounded-[var(--radius-neu)] bg-[#fff8f0] px-4 shadow-[var(--neu-in)]">
            <span className="text-sm font-semibold text-[#1d2b1f]">{platform}</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#4a5e3a]">Terdeteksi otomatis dari nickname kamu</p>
        </div>
        <div>
          <FieldLabel required>Jumlah Rupiah</FieldLabel>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[1.15rem] top-1/2 z-10 -translate-y-1/2 text-sm font-semibold text-[#4a5e3a]"
            >
              Rp
            </span>
            <input
              type="number"
              min={5000}
              step={1000}
              value={rupiahInput}
              onChange={(e) => setRupiahInput(e.target.value)}
              placeholder="5000"
              aria-label="Jumlah rupiah"
              className="neu-field neu-field-icon font-mono text-sm"
            />
          </div>
        </div>
        <DiscountCodeInput onApply={setDiscount} category="Claim Limit" />
        <PriceSummary basePrice={rupiah} discountPercent={discount} />
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
      productLabel={`${formatNumber(claims)} Claim Limit`}
      orderPayload={{ type: 'claim', nick: (playerNick || nick).trim(), platform, baseAmount: finalPrice, details: { claims, discountPct: discount } }}
    />
    </>
  );
}

function getPickTier(idx, total) {
  const isTop = idx === 0;
  const featured = idx < Math.ceil(total * 0.5);
  return {
    featured,
    isTop,
    priceSize: isTop ? 'text-base' : featured ? 'text-sm' : 'text-xs',
    elevation: featured ? 'shadow-[var(--neu-out-lg)]' : 'shadow-[var(--neu-out)]',
  };
}

export function ClaimTab() {
  const { nick } = usePlayerAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRupiah, setSelectedRupiah] = useState(0);
  const [myClaims, setMyClaims] = useState(null);

  useEffect(() => {
    if (!nick) { setMyClaims(null); return; }
    let alive = true;
    fetch('/api/player/claims')
      .then((r) => r.json())
      .then((d) => { if (alive && d.ok) setMyClaims(d.claims); })
      .catch(() => {});
    return () => { alive = false; };
  }, [nick]);

  const total = PICKS_DESC.length;

  function openWith(rupiah) {
    if (!nick) return;
    setSelectedRupiah(rupiah);
    setModalOpen(true);
  }

  return (
    <>
      <div className="mx-auto max-w-2xl" data-aos="fade-up" data-aos-duration="500">
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="neu-icon h-11 w-11 rounded-[14px] text-[#1d2b1f]">
              <LandPlot size={20} aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-[#1d2b1f]">Beli Claim Limit</h3>
              <p className="text-xs text-[#4a5e3a]">
                Kurs: Rp 1 = {CLAIM_RATE} Claim Limit
                {myClaims != null && <> · Claim kamu: <span className="font-mono font-bold text-[#1d2b1f]">{formatNumber(myClaims)}</span></>}
              </p>
            </div>
          </div>

          <div className="mb-1 flex items-center justify-between">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#4a5e3a]">Quick Pick</p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {PICKS_DESC.map(({ rupiah, popular }, idx) => {
              const tier = getPickTier(idx, total);
              return (
                <button
                  key={rupiah}
                  type="button"
                  onClick={() => openWith(rupiah)}
                  disabled={!nick}
                  title={!nick ? 'Login dulu untuk order' : undefined}
                  data-aos="fade-up"
                  data-aos-delay={idx * 40}
                  data-aos-duration="400"
                  className={cn(
                    'flex min-h-[48px] flex-col items-center gap-1 rounded-[var(--radius-neu-lg)] px-4 py-4 text-center',
                    'will-change-transform [transition:transform_150ms_ease,box-shadow_150ms_ease]',
                    nick
                      ? cn(
                          'bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))]',
                          tier.elevation,
                          'hover:-translate-y-[3px] hover:shadow-[var(--neu-out-lg)]',
                        )
                      : 'cursor-not-allowed bg-[#fff8f0] shadow-[var(--neu-in)]',
                  )}
                >
                  <span className="flex min-h-[18px] items-center justify-center">
                    {tier.isTop ? (
                      <span className="neu-chip px-2 py-0.5 text-[0.55rem] tracking-[0.08em]">
                        MAX VALUE
                      </span>
                    ) : popular ? (
                      <span className="neu-chip px-2 py-0.5 text-[0.55rem] tracking-[0.08em]">
                        POPULAR
                      </span>
                    ) : null}
                  </span>
                  <p className={cn('font-mono font-bold text-[#1d2b1f]', tier.priceSize)}>
                    {formatRupiah(rupiah)}
                  </p>
                  <p className="text-[0.65rem] text-[#4a5e3a]">
                    {formatNumber(rupiah * CLAIM_RATE)} Claim Limit
                  </p>
                </button>
              );
            })}
          </div>

          <Button fullWidth size="sm" onClick={() => openWith(0)} disabled={!nick} title={!nick ? 'Login dulu untuk order' : undefined}>
            {nick ? 'Beli Custom Amount' : <><Lock size={13} aria-hidden="true" /> Login dulu untuk order</>}
          </Button>
        </GlassCard>
      </div>

      <ClaimOrderModal open={modalOpen} onClose={() => setModalOpen(false)} initialRupiah={selectedRupiah} />
    </>
  );
}

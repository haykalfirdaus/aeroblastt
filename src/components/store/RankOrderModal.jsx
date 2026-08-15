'use client';
import { useEffect, useState } from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { AgreeVerify } from './AgreeVerify';
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { RANKS, RANK_DURATION_OPTIONS, RANK_ORDER, RANK_PRICES } from '@/data/ranks';
import { SITE } from '@/data/config';
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import { usePlayerRank } from '@/hooks/usePlayerRank';
import { cn } from '@/lib/cn';

// Unix timestamp (detik) → "12 Sep 2026"
function formatExpiry(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function RankOrderModal({ rank, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const { rank: detectedRank, permanent: rankPermanent, expiry: rankExpiry, loading: rankLoading } = usePlayerRank();
  const isBedrock = playerNick?.includes('.');
  const isJava = !!playerNick && !playerNick.includes('.');
  const platformLocked = isBedrock || isJava;
  const detectedPlatform = isBedrock ? 'Bedrock / PE' : isJava ? 'Java Edition' : '';
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState(detectedPlatform);
  const [ownedRank, setOwnedRank] = useState('none');
  const [duration, setDuration] = useState('permanent');
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);

  // Sinkronisasi platform & ownedRank saat modal dibuka atau playerNick berubah
  useEffect(() => {
    if (!open) return;
    setPlatform(detectedPlatform || platform);
    setOwnedRank(detectedRank ? detectedRank.toLowerCase() : 'none');
  }, [open, detectedRank, detectedPlatform]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rank dikunci untuk semua player yang login — termasuk yang belum punya rank
  // (detectedRank null = Member), supaya tidak bisa mengaku punya rank palsu.
  const rankLocked = !!playerNick && !rankLoading;

  if (!rank) return null;

  const durOpt = RANK_DURATION_OPTIONS.find((d) => d.id === duration);
  const ownedPrice = RANK_PRICES[ownedRank === 'none' ? 'NONE' : ownedRank.toUpperCase()] ?? 0;
  const targetPrice = rank.price;
  const upgradeBase = Math.max(0, targetPrice - ownedPrice);
  const basePrice = Math.round(upgradeBase * (durOpt.percentOfBase / 100));
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  const canOrder = ownedRank !== rank.key.toLowerCase() && RANK_ORDER.indexOf(rank.key) > RANK_ORDER.indexOf(ownedRank === 'none' ? 'NONE' : ownedRank.toUpperCase());

  function handleQris() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname kamu!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan terlebih dahulu!', 'error');
    setBetaOpen(true);
  }

  return (
    <>
    <Modal open={open} onClose={onClose} title={`Order Rank ${rank.name}`} badge="AEROBLAST STORE" size="md">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />

        <div>
          <FieldLabel required>Nickname Minecraft</FieldLabel>
          <TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Masukkan username in-game kamu'} readOnly={!!playerNick} />
        </div>

        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => !platformLocked && setPlatform(e.target.value)} disabled={platformLocked}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-[#354530]">Terdeteksi Bedrock — platform dikunci otomatis</p>}
          {isJava && <p className="mt-1 text-[11px] text-[#354530]">Terdeteksi Java (nama tanpa titik) — platform dikunci otomatis</p>}
        </div>

        <div>
          <FieldLabel>
            Rank Saat Ini
            {rankLoading && <RefreshCw size={11} aria-hidden="true" className="ml-1.5 inline animate-spin text-[#5a7048]" />}
            {!rankLoading && playerNick && <span className="ml-1.5 text-[0.6rem] text-[#5a7048]">(terdeteksi otomatis)</span>}
          </FieldLabel>
          <SelectField value={ownedRank} onChange={(e) => !rankLocked && setOwnedRank(e.target.value)} disabled={rankLoading || rankLocked}>
            <option value="none">Belum punya rank / Member</option>
            {(() => {
              const targetIdx = RANKS.findIndex((r) => r.key === rank.key);
              const detectedIdx = detectedRank ? RANKS.findIndex((r) => r.key === detectedRank) : -1;
              return RANKS.map((r, idx) => {
                if (r.key === rank.key) return null;
                const aboveTarget = idx > targetIdx;
                const belowDetected = detectedRank && idx < detectedIdx;
                const disabled = aboveTarget || belowDetected;
                return (
                  <option key={r.key} value={r.key.toLowerCase()} disabled={disabled}>
                    {r.name} ({formatRupiah(r.price)}){aboveTarget ? ' — tidak tersedia' : ''}
                  </option>
                );
              });
            })()}
          </SelectField>
          {rankLocked && (
            <p className="mt-1 text-[11px] text-[#354530]">
              {!detectedRank
                ? 'Kamu belum punya rank — terdeteksi otomatis'
                : rankPermanent
                  ? 'Rank permanen terdeteksi otomatis — tidak bisa diubah manual'
                  : `Rank bulanan terdeteksi otomatis${rankExpiry ? ` — berlaku sampai ${formatExpiry(rankExpiry)}` : ''}`}
            </p>
          )}
        </div>

        <div>
          <FieldLabel required>Durasi</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            {RANK_DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDuration(opt.id)}
                aria-pressed={duration === opt.id}
                className={cn(
                  'min-h-[48px] rounded-[var(--radius-neu)] px-3 py-3 text-center transition-transform',
                  duration === opt.id
                    ? 'bg-[#fff8f0] shadow-[var(--neu-in)]'
                    : 'neu-press bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] shadow-[var(--neu-out)]'
                )}
              >
                {opt.badge && <span className="mb-1 block text-[0.6rem] font-bold text-[#5a7048]">{opt.badge}</span>}
                <span className="block text-sm font-bold text-[#1d2b1f]">{opt.label}</span>
                <span className="block text-[0.65rem] text-[#4a5e3a]">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <DiscountCodeInput onApply={setDiscount} category="Rank" />

        <PriceSummary basePrice={basePrice} discountPercent={discount} />

        <AgreeVerify checked={agreed} onChange={(ok) => setAgreed(ok)} />

        <div className="flex flex-col gap-2">
          <Button fullWidth size="sm" onClick={handleQris} disabled={basePrice <= 0 || !playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>
            {playerNick ? 'Mulai Pembayaran' : (
              <span className="inline-flex items-center gap-1.5">
                <Lock size={13} aria-hidden="true" />
                Login dulu untuk order
              </span>
            )}
          </Button>
        </div>
      </div>

    </Modal>
    <BetaPaymentModal
      open={betaOpen}
      onClose={() => setBetaOpen(false)}
      productLabel={`Rank ${rank.name}${durOpt.label !== 'Permanen' ? ` (${durOpt.label})` : ''}`}
      orderPayload={{
        type: 'rank',
        nick: (playerNick || nick).trim(),
        platform,
        baseAmount: finalPrice,
        details: {
          target: rank.key,
          duration: durOpt.id,
          owned: ownedRank === 'none' ? null : ownedRank,
          discountPct: discount,
        },
      }}
    />
    </>
  );
}

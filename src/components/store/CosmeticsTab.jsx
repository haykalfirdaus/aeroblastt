'use client';
import { useEffect, useRef, useState } from 'react';
import { Lock, Star, User } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, TextField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PriceSummary } from './PriceSummary';
import { BetaPaymentModal } from './BetaPaymentModal';
import { drawPrefixTag, textFits, ICON_LABELS } from '@/lib/prefixTag';
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';

const BASE_PRICE = 25000;
const CUSTOM_LOGO_ADDON = 15000;
const TEXT_COLOR_ADDON = 10000;
const NICK_COLOR_ADDON = 10000;

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/*
 * Preview tag 74×12 — persis renderer yang dipakai admin untuk menghasilkan
 * PNG finalnya, jadi yang dilihat pembeli = yang dikirim. Sengaja TIDAK ada
 * tombol download di sisi user: file PNG hanya bisa diambil admin setelah
 * order lunas.
 */
function TagPreview({ cfg, zoom = 4 }) {
  const ref = useRef(null);
  useEffect(() => {
    drawPrefixTag(ref.current, cfg, 8);
  }, [cfg]);
  return (
    <canvas
      ref={ref}
      className="mx-auto [image-rendering:pixelated]"
      style={{ width: 74 * zoom, maxWidth: '100%', height: 'auto' }}
      aria-label={`Preview prefix ${cfg.text || ''}`}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function CosmeticOrderModal({ cfg, addons, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const platform = isBedrock ? 'Bedrock / PE' : 'Java Edition';
  const [discount, setDiscount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [betaOpen, setBetaOpen] = useState(false);

  const basePrice =
    BASE_PRICE +
    (addons.customLogo ? CUSTOM_LOGO_ADDON : 0) +
    (addons.textColor ? TEXT_COLOR_ADDON : 0) +
    (addons.nickColor ? NICK_COLOR_ADDON : 0);
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleQris() {
    if (!playerNick?.trim()) return showToast('Login dulu untuk order!', 'error');
    if (!cfg.text.trim()) return showToast('Masukkan teks prefix!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    setBetaOpen(true);
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Order Custom Prefix" badge="COSMETIC">
        <div className="mt-6 flex flex-col gap-4">
          <CountdownBanner open={open} />
          <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 text-center shadow-[var(--neu-in)]">
            <p className="mb-2 text-xs text-[#4a5e3a]">Preview Pesanan</p>
            <TagPreview cfg={cfg} zoom={3} />
          </div>
          <div className="rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 text-sm text-[#4a5e3a] space-y-1 shadow-[var(--neu-in)]">
            <p><span className="text-[#1d2b1f] font-semibold">Nickname:</span> {playerNick} <span className="text-xs">({platform})</span></p>
            <p><span className="text-[#1d2b1f] font-semibold">Teks Prefix:</span> {cfg.text}</p>
            <p><span className="text-[#1d2b1f] font-semibold">Warna Prefix:</span> <span className="font-mono">{cfg.base}</span></p>
            <p><span className="text-[#1d2b1f] font-semibold">Logo:</span> {ICON_LABELS[cfg.icon]}</p>
            {addons.textColor && (
              <p><span className="text-[#1d2b1f] font-semibold">Warna Teks:</span> <span className="font-mono">{cfg.textColor}</span> · shadow <span className="font-mono">{cfg.shadowColor}</span></p>
            )}
            {addons.nickColor && (
              <p><span className="text-[#1d2b1f] font-semibold">Warna Nick:</span> <span className="font-mono">{addons.nickColorValue}</span></p>
            )}
          </div>
          <DiscountCodeInput onApply={setDiscount} category="Custom Prefix" />
          <PriceSummary basePrice={basePrice} discountPercent={discount} />
          <CheckboxField checked={agreed} onChange={setAgreed}>
            Saya menyetujui <a href="/terms" target="_blank" className="text-[#1d2b1f] hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.
          </CheckboxField>
          <Button fullWidth size="sm" onClick={handleQris} disabled={!playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>
            {playerNick ? 'Mulai Pembayaran' : <><Lock size={13} aria-hidden="true" /> Login dulu untuk order</>}
          </Button>
        </div>
      </Modal>
      <BetaPaymentModal
        open={betaOpen}
        onClose={() => setBetaOpen(false)}
        productLabel={`Custom Prefix [${cfg.text || 'CUSTOM'}]`}
        orderPayload={{
          type: 'cosmetic',
          nick: (playerNick || '').trim(),
          platform,
          baseAmount: finalPrice,
          details: {
            prefixText: cfg.text,
            base: cfg.base,
            icon: cfg.icon,
            textColor: addons.textColor ? cfg.textColor : '#ffffff',
            shadowColor: addons.textColor ? cfg.shadowColor : '#000000',
            nickColor: addons.nickColor ? addons.nickColorValue : null,
            discountPct: discount,
          },
        }}
      />
    </>
  );
}

export function CosmeticsTab() {
  const { nick } = usePlayerAuth();
  const showToast = useToast();
  const [prefixText, setPrefixText] = useState('');
  const [base, setBase] = useState('#00e1ff');
  const [icon, setIcon] = useState('basic');
  const [customTextColor, setCustomTextColor] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');
  const [shadowColor, setShadowColor] = useState('#000000');
  const [addNickColor, setAddNickColor] = useState(false);
  const [nickColor, setNickColor] = useState('#aaaaaa');
  const [modalOpen, setModalOpen] = useState(false);

  const fits = textFits(prefixText || 'CUSTOM');
  const cfg = {
    text: prefixText || 'CUSTOM',
    base,
    icon,
    textColor: customTextColor ? textColor : '#ffffff',
    shadowColor: customTextColor ? shadowColor : '#000000',
  };

  const totalPrice =
    BASE_PRICE +
    (icon === 'custom' ? CUSTOM_LOGO_ADDON : 0) +
    (customTextColor ? TEXT_COLOR_ADDON : 0) +
    (addNickColor ? NICK_COLOR_ADDON : 0);

  function handleOrder() {
    if (!prefixText.trim()) return showToast('Masukkan teks prefix terlebih dahulu!', 'error');
    if (!fits) return showToast('Teks terlalu panjang — kurangi hurufnya!', 'error');
    if (!isValidHex(base)) return showToast('Format warna prefix tidak valid (gunakan #RRGGBB)!', 'error');
    if (customTextColor && (!isValidHex(textColor) || !isValidHex(shadowColor)))
      return showToast('Format warna teks/shadow tidak valid!', 'error');
    if (addNickColor && !isValidHex(nickColor)) return showToast('Format warna nickname tidak valid!', 'error');
    setModalOpen(true);
  }

  return (
    <>
      <div className="neu-grid neu-grid-2 mx-auto max-w-4xl">
        {/* Builder Card */}
        <GlassCard className="p-6" data-aos="fade-up" data-aos-duration="500">
          <h3 className="mb-5 font-display text-base font-bold text-[#1d2b1f]">Custom Prefix Builder</h3>

          {/* Live Preview — pixel-art persis hasil akhirnya */}
          <div className="mb-6 rounded-[var(--radius-neu-lg)] bg-[#2b2b2b] p-5 text-center shadow-[var(--neu-in)]">
            <p className="mb-3 text-xs uppercase tracking-wider text-[#fff8f0]/70">Preview Prefix</p>
            <TagPreview cfg={cfg} />
            <p className="mt-3 font-mono text-xs text-[#fff8f0]/80">
              <span style={{ color: addNickColor ? nickColor : '#aaaaaa' }}>{nick || 'Steve'}</span>
              <span className="text-[#fff8f0]/50"> » halo semua</span>
            </p>
          </div>

          {/* Prefix text */}
          <div className="mb-4">
            <FieldLabel required>Teks Prefix</FieldLabel>
            <TextField value={prefixText} onChange={(e) => setPrefixText(e.target.value.slice(0, 12))} placeholder="SULTAN, KING, BOSS..." maxLength={12} />
            <p className={`mt-1 text-xs ${fits ? 'text-[#4a5e3a]' : 'font-semibold text-red-700'}`}>
              {fits ? `${prefixText.length}/12 karakter` : 'Teks terlalu panjang untuk plate — kurangi hurufnya'}
            </p>
          </div>

          {/* Base color — mid & dark otomatis mengikuti */}
          <div className="mb-4">
            <FieldLabel required>Warna Prefix (HEX)</FieldLabel>
            <div className="flex items-center gap-3">
              <input type="color" aria-label="Pilih warna prefix" value={base} onChange={(e) => setBase(e.target.value)} className="h-12 w-14 shrink-0 cursor-pointer rounded-[var(--radius-neu)] border-0 bg-[#fff8f0] p-1.5 shadow-[var(--neu-in)]" />
              <TextField value={base} onChange={(e) => setBase(e.target.value)} placeholder="#00e1ff" className="flex-1 font-mono uppercase" />
            </div>
            <p className="mt-1 text-xs text-[#4a5e3a]">Warna isi &amp; bayangan plate menyesuaikan otomatis.</p>
          </div>

          {/* Icon picker */}
          <div className="mb-4">
            <FieldLabel required>Logo Kiri</FieldLabel>
            <div className="flex gap-2">
              {[
                { id: 'basic', label: ICON_LABELS.basic, Icon: User, price: 'Termasuk' },
                { id: 'custom', label: ICON_LABELS.custom, Icon: Star, price: `+${formatRupiah(CUSTOM_LOGO_ADDON)}` },
              ].map(({ id, label, Icon, price }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIcon(id)}
                  aria-pressed={icon === id}
                  className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-neu)] bg-[#fff8f0] px-3 py-2 text-xs font-bold [transition:box-shadow_150ms_ease,color_150ms_ease] ${
                    icon === id ? 'text-[#1d2b1f] shadow-[var(--neu-in)]' : 'text-[#4a5e3a] shadow-[var(--neu-out)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5"><Icon size={13} aria-hidden="true" /> {label}</span>
                  <span className="font-mono text-[10px] font-semibold">{price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text color addon */}
          <CheckboxField checked={customTextColor} onChange={setCustomTextColor} className="mb-3">
            <span className="font-semibold text-[#1d2b1f]">Ganti warna teks &amp; shadow</span>
            <span className="ml-1 font-mono text-xs text-[#1d2b1f]">(+{formatRupiah(TEXT_COLOR_ADDON)})</span>
          </CheckboxField>
          {customTextColor && (
            <div className="mb-4 ml-8 flex flex-col gap-3">
              <div>
                <FieldLabel>Warna Teks</FieldLabel>
                <div className="flex items-center gap-3">
                  <input type="color" aria-label="Pilih warna teks" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-12 w-14 shrink-0 cursor-pointer rounded-[var(--radius-neu)] border-0 bg-[#fff8f0] p-1.5 shadow-[var(--neu-in)]" />
                  <TextField value={textColor} onChange={(e) => setTextColor(e.target.value)} placeholder="#ffffff" className="flex-1 font-mono uppercase" />
                </div>
              </div>
              <div>
                <FieldLabel>Warna Shadow Teks</FieldLabel>
                <div className="flex items-center gap-3">
                  <input type="color" aria-label="Pilih warna shadow teks" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className="h-12 w-14 shrink-0 cursor-pointer rounded-[var(--radius-neu)] border-0 bg-[#fff8f0] p-1.5 shadow-[var(--neu-in)]" />
                  <TextField value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} placeholder="#000000" className="flex-1 font-mono uppercase" />
                </div>
              </div>
            </div>
          )}

          {/* Nick color addon */}
          <CheckboxField checked={addNickColor} onChange={setAddNickColor} className="mb-3">
            <span className="font-semibold text-[#1d2b1f]">Warna Nickname juga</span>
            <span className="ml-1 font-mono text-xs text-[#1d2b1f]">(+{formatRupiah(NICK_COLOR_ADDON)})</span>
          </CheckboxField>
          {addNickColor && (
            <div className="mb-4 ml-8">
              <FieldLabel>Warna Nickname (HEX)</FieldLabel>
              <div className="flex items-center gap-3">
                <input type="color" aria-label="Pilih warna nickname" value={nickColor} onChange={(e) => setNickColor(e.target.value)} className="h-12 w-14 shrink-0 cursor-pointer rounded-[var(--radius-neu)] border-0 bg-[#fff8f0] p-1.5 shadow-[var(--neu-in)]" />
                <TextField value={nickColor} onChange={(e) => setNickColor(e.target.value)} placeholder="#aaaaaa" className="flex-1 font-mono uppercase" />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mb-5 rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-in)]">
            <div className="flex justify-between text-xs"><span className="text-[#4a5e3a]">Custom Prefix</span><span className="font-mono font-semibold text-[#1d2b1f]">{formatRupiah(BASE_PRICE)}</span></div>
            {icon === 'custom' && <div className="mt-2 flex justify-between text-xs"><span className="text-[#4a5e3a]">{ICON_LABELS.custom}</span><span className="font-mono font-semibold text-[#1d2b1f]">+{formatRupiah(CUSTOM_LOGO_ADDON)}</span></div>}
            {customTextColor && <div className="mt-2 flex justify-between text-xs"><span className="text-[#4a5e3a]">Warna Teks &amp; Shadow</span><span className="font-mono font-semibold text-[#1d2b1f]">+{formatRupiah(TEXT_COLOR_ADDON)}</span></div>}
            {addNickColor && <div className="mt-2 flex justify-between text-xs"><span className="text-[#4a5e3a]">Warna Nickname</span><span className="font-mono font-semibold text-[#1d2b1f]">+{formatRupiah(NICK_COLOR_ADDON)}</span></div>}
            <div className="neu-rule mt-3" />
            <div className="mt-3 flex justify-between"><span className="font-bold text-[#1d2b1f]">Total</span><span className="font-mono text-lg font-bold text-[#1d2b1f]">{formatRupiah(totalPrice)}</span></div>
          </div>

          <Button fullWidth size="sm" onClick={handleOrder} disabled={!nick} title={!nick ? 'Login dulu untuk order' : undefined}>
            {nick ? 'Order Sekarang' : <><Lock size={13} aria-hidden="true" /> Login dulu untuk order</>}
          </Button>
        </GlassCard>

        {/* Info Card */}
        <GlassCard className="flex flex-col items-center gap-5 p-6" data-aos="fade-up" data-aos-duration="500">
          <h3 className="font-display text-base font-bold text-[#1d2b1f]">Tampilan In-Game</h3>
          <img src="/customprefix.png" alt="Contoh Custom Prefix in-game" className="max-w-full rounded-[var(--radius-neu-lg)] shadow-[var(--neu-out)]" />
          <p className="text-center text-xs text-[#4a5e3a]">Prefix kamu dibuat pixel-per-pixel sama seperti tag rank resmi server.</p>
          <div className="w-full rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 text-xs text-[#4a5e3a] space-y-1.5 shadow-[var(--neu-in)]">
            <p>— Preview di atas = hasil jadi yang dipasang</p>
            <p>— Warna plate bebas, isi &amp; bayangan otomatis serasi</p>
            <p>— Logo Custom &amp; warna teks tersedia sebagai add-on</p>
            <p>— Dipasang admin setelah pembayaran terverifikasi</p>
            <p>— Aktif permanen selama akun tidak di-ban</p>
          </div>
        </GlassCard>
      </div>

      <CosmeticOrderModal
        cfg={cfg}
        addons={{ customLogo: icon === 'custom', textColor: customTextColor, nickColor: addNickColor, nickColorValue: nickColor }}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

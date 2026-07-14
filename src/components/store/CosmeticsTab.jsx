import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CheckboxField, FieldLabel, SelectField, TextField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { CountdownBanner } from './CountdownBanner';
import { DiscountCodeInput } from './DiscountCodeInput';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { PriceSummary } from './PriceSummary';
import { SITE } from '@/data/config';
import { buildCosmeticOrderMessage, openWhatsApp } from '@/utils/whatsapp';
import { sendInvoice } from '@/utils/invoice';
// discount check is done inside DiscountCodeInput via async API
import { formatRupiah } from '@/utils/currency';
import { useToast } from '@/context/ToastContext';
import { usePlayerAuth } from '@/context/PlayerAuthContext';
import customPrefixImg from '@/assets/images/customprefix.png';

const BASE_PRICE = 25000;
const NICK_COLOR_ADDON = 10000;

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function CosmeticOrderModal({ prefixText, prefixColor, nickColor, open, onClose }) {
  const showToast = useToast();
  const { nick: playerNick } = usePlayerAuth();
  const isBedrock = playerNick?.includes('.');
  const [nick, setNick] = useState('');
  const [platform, setPlatform] = useState(isBedrock ? 'Bedrock / PE' : '');
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState('');
  const [agreed, setAgreed] = useState(false);

  const basePrice = BASE_PRICE + (nickColor ? NICK_COLOR_ADDON : 0);
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  function handleSend() {
    if (!(playerNick || nick).trim()) return showToast('Masukkan nickname!', 'error');
    if (!platform) return showToast('Pilih platform!', 'error');
    if (!prefixText.trim()) return showToast('Masukkan teks prefix!', 'error');
    if (!payment) return showToast('Pilih metode pembayaran!', 'error');
    if (!agreed) return showToast('Setujui syarat & ketentuan!', 'error');
    const orderData = { nick: (playerNick || nick).trim(), platform, prefixText, prefixColor, nickColor: nickColor || null, discountPct: discount, finalAmount: finalPrice, paymentMethod: payment };
    sendInvoice({ type: 'cosmetic', ...orderData });
    openWhatsApp(buildCosmeticOrderMessage(orderData));
  }

  return (
    <Modal open={open} onClose={onClose} title="Order Custom Prefix" badge="COSMETIC">
      <div className="mt-6 flex flex-col gap-4">
        <CountdownBanner open={open} />
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="mb-2 text-xs text-text-dim">Preview Pesanan</p>
          <div className="flex items-center justify-center gap-2">
            <span className="rounded px-2 py-0.5 font-bold text-sm" style={{ backgroundColor: prefixColor, color: '#111' }}>[{prefixText || 'CUSTOM'}]</span>
            <span className="text-sm" style={{ color: nickColor || '#aaaaaa' }}>Steve</span>
          </div>
        </div>
        <div><FieldLabel required>Nickname</FieldLabel><TextField value={playerNick || nick} onChange={(e) => !playerNick && setNick(e.target.value)} placeholder={playerNick ? '' : 'Username in-game'} readOnly={!!playerNick} /></div>
        <div>
          <FieldLabel required>Platform</FieldLabel>
          <SelectField value={platform} onChange={(e) => !isBedrock && setPlatform(e.target.value)} disabled={isBedrock}>
            <option value="">-- Pilih Platform --</option>
            {SITE.platforms.map((p) => <option key={p}>{p}</option>)}
          </SelectField>
          {isBedrock && <p className="mt-1 text-[11px] text-cyan-400">Terdeteksi Bedrock — platform dikunci otomatis</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-text-muted space-y-1">
          <p><span className="text-text-bright font-semibold">Teks Prefix:</span> [{prefixText || 'CUSTOM'}]</p>
          <p><span className="text-text-bright font-semibold">Warna Prefix:</span> <span className="font-mono">{prefixColor}</span></p>
          {nickColor && <p><span className="text-text-bright font-semibold">Warna Nick:</span> <span className="font-mono">{nickColor}</span></p>}
        </div>
        <DiscountCodeInput onApply={setDiscount} />
        <PriceSummary basePrice={basePrice} discountPercent={discount} />
        <PaymentMethodPicker value={payment} onChange={setPayment} />
        <CheckboxField checked={agreed} onChange={setAgreed}>Saya menyetujui <a href="/terms" target="_blank" className="text-neon-300 hover:underline">Syarat &amp; Ketentuan</a> yang berlaku.</CheckboxField>
        <Button fullWidth size="sm" onClick={handleSend} disabled={!playerNick} title={!playerNick ? 'Login dulu untuk melakukan order' : undefined}>{playerNick ? 'Order via WhatsApp' : '🔒 Login dulu untuk order'}</Button>
      </div>
    </Modal>
  );
}

export function CosmeticsTab() {
  const { nick } = usePlayerAuth();
  const showToast = useToast();
  const [prefixText, setPrefixText] = useState('');
  const [prefixColor, setPrefixColor] = useState('#00bfff');
  const [addNickColor, setAddNickColor] = useState(false);
  const [nickColor, setNickColor] = useState('#aaaaaa');
  const [modalOpen, setModalOpen] = useState(false);

  const totalPrice = BASE_PRICE + (addNickColor ? NICK_COLOR_ADDON : 0);

  function handleOrder() {
    if (!prefixText.trim()) return showToast('Masukkan teks prefix terlebih dahulu!', 'error');
    if (!isValidHex(prefixColor)) return showToast('Format warna prefix tidak valid (gunakan #RRGGBB)!', 'error');
    if (addNickColor && !isValidHex(nickColor)) return showToast('Format warna nickname tidak valid!', 'error');
    setModalOpen(true);
  }

  return (
    <>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Builder Card */}
        <GlassCard className="p-6">
          <h3 className="mb-5 font-display text-base font-bold text-text-bright">Custom Prefix Builder</h3>

          {/* Live Preview */}
          <div className="mb-6 rounded-xl border border-white/10 bg-void/50 p-4 text-center">
            <p className="mb-3 text-xs uppercase tracking-wider text-text-dim">Preview Prefix</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded px-2 py-0.5 text-sm font-bold" style={{ backgroundColor: prefixColor, color: '#111' }}>
                [{prefixText || 'CUSTOM'}]
              </span>
              <span className="text-sm" style={{ color: addNickColor ? nickColor : '#aaaaaa' }}>Steve</span>
            </div>
          </div>

          {/* Prefix text */}
          <div className="mb-4">
            <FieldLabel required>Teks Prefix</FieldLabel>
            <TextField value={prefixText} onChange={(e) => setPrefixText(e.target.value.slice(0, 16))} placeholder="Sultan, King, Boss..." maxLength={16} />
            <p className="mt-1 text-xs text-text-dim">{prefixText.length}/16 karakter · ditampilkan sebagai [{prefixText || '...'}]</p>
          </div>

          {/* Prefix Color */}
          <div className="mb-4">
            <FieldLabel required>Warna Prefix (HEX)</FieldLabel>
            <div className="flex items-center gap-3">
              <input type="color" value={prefixColor} onChange={(e) => setPrefixColor(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-white/12 bg-transparent p-1" />
              <TextField value={prefixColor} onChange={(e) => setPrefixColor(e.target.value)} placeholder="#00bfff" className="flex-1 font-mono uppercase" />
            </div>
          </div>

          {/* Nick color toggle */}
          <CheckboxField checked={addNickColor} onChange={setAddNickColor} className="mb-3">
            <span className="font-semibold text-text-bright">Warna Nickname juga</span>
            <span className="ml-1 font-mono text-xs text-neon-300">(+{formatRupiah(NICK_COLOR_ADDON)})</span>
          </CheckboxField>

          {addNickColor && (
            <div className="mb-4 ml-8">
              <FieldLabel>Warna Nickname (HEX)</FieldLabel>
              <div className="flex items-center gap-3">
                <input type="color" value={nickColor} onChange={(e) => setNickColor(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-white/12 bg-transparent p-1" />
                <TextField value={nickColor} onChange={(e) => setNickColor(e.target.value)} placeholder="#aaaaaa" className="flex-1 font-mono uppercase" />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex justify-between text-xs"><span className="text-text-muted">Custom Prefix</span><span className="font-mono font-semibold text-text-bright">{formatRupiah(BASE_PRICE)}</span></div>
            {addNickColor && <div className="mt-2 flex justify-between text-xs"><span className="text-text-muted">Warna Nickname</span><span className="font-mono font-semibold text-neon-300">+{formatRupiah(NICK_COLOR_ADDON)}</span></div>}
            <div className="mt-3 flex justify-between border-t border-white/8 pt-3"><span className="font-bold text-text-bright">Total</span><span className="font-mono text-lg font-bold text-neon-300">{formatRupiah(totalPrice)}</span></div>
          </div>

          <Button fullWidth size="sm" onClick={handleOrder} disabled={!nick} title={!nick ? 'Login dulu untuk order' : undefined}>
            {nick ? 'Order Sekarang' : <><Lock size={12} className="inline mr-1" />Login dulu untuk order</>}
          </Button>
        </GlassCard>

        {/* Example Card */}
        <GlassCard className="flex flex-col items-center gap-5 p-6">
          <h3 className="font-display text-base font-bold text-text-bright">Contoh Tampilan In-Game</h3>
          <img src={customPrefixImg} alt="Contoh Custom Prefix in-game" className="max-w-full rounded-xl border border-white/10" />
          <p className="text-center text-xs text-text-muted">Tampilan prefix kamu di in-game setelah setup selesai.</p>
          <div className="w-full rounded-xl border border-neon-500/18 bg-neon-500/6 p-4 text-xs text-text-muted space-y-1.5">
            <p>— Prefix eksklusif hanya untukmu</p>
            <p>— Bisa diatur warna bebas</p>
            <p>— Aktif permanen selama akun tidak di-ban</p>
          </div>
        </GlassCard>
      </div>

      <CosmeticOrderModal prefixText={prefixText} prefixColor={prefixColor} nickColor={addNickColor ? nickColor : null} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

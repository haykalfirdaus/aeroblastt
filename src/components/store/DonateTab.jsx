'use client';
import { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/utils/currency';
import { openWhatsApp } from '@/utils/whatsapp';
import { cn } from '@/lib/cn';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

function buildDonateMessage({ name, amount, message }) {
  const from = name.trim() || 'Anonim';
  const msg = message.trim() || '-';
  return [
    '--- [ AEROBLAST DONASI ] ---',
    '',
    'Halo Admin! Ada donasi masuk 🎉',
    '',
    `Dari: ${from}`,
    `Nominal: ${formatRupiah(amount)}`,
    `Pesan: ${msg}`,
    '',
    'Terima kasih telah mendukung AeroBlast Network! ❤️',
  ].join('\n');
}

export function DonateTab() {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const numAmount = Number(String(amount).replace(/\D/g, ''));
  const isValid = numAmount >= 1000;

  function handleQuick(val) {
    setAmount(String(val));
  }

  function handleAmountInput(e) {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  }

  function handleSubmit() {
    if (!isValid) return;
    openWhatsApp(buildDonateMessage({ name, amount: numAmount, message }));
    setDone(true);
  }

  function handleReset() {
    setAmount('');
    setName('');
    setMessage('');
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-[#B4E035]/30 bg-[#B4E035]/[0.07] px-6 py-16 text-center"
        style={{ animation: 'page-wipe-in 0.4s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#B4E035]/40 bg-[#B4E035]/15">
          <Heart size={28} className="text-[#748F1C]" fill="currentColor" />
        </div>
        <div>
          <h3 className="font-display text-xl font-extrabold text-[#1A2E1A]">Terima kasih atas donasinya!</h3>
          <p className="mt-1.5 text-sm text-[#6B7F5A]">
            Dukungan kamu sangat berarti untuk AeroBlast Network. 💚
          </p>
          {name.trim() && (
            <p className="mt-1 text-xs text-[#8A9E7A]">— {name.trim()}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-[#D8D1C0] bg-[#F0EBE0] px-4 py-2 text-xs font-semibold text-[#6B7F5A] transition-colors hover:border-[#B4E035]/30 hover:text-[#1A2E1A]"
        >
          Donasi Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg" style={{ animation: 'page-wipe-in 0.28s cubic-bezier(0.22,1,0.36,1) both' }}>
      {/* Header */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#B4E035]/35 bg-[#B4E035]/10">
          <Heart size={22} className="text-[#748F1C]" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-[#1A2E1A]">Dukung AeroBlast</h3>
          <p className="text-xs text-[#6B7F5A]">Donasi bebas untuk bantu server tetap berjalan</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[#D8D1C0] bg-[#FAFAF7] p-5">
        {/* Nominal cepat */}
        <div>
          <p className="mb-2 text-xs font-semibold text-[#6B7F5A]">Pilih nominal</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuick(val)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                  numAmount === val
                    ? 'border-[#B4E035]/50 bg-[#B4E035]/20 text-[#748F1C] ring-1 ring-[#B4E035]/40'
                    : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#6B7F5A] hover:border-[#B4E035]/30 hover:text-[#1A2E1A]'
                )}
              >
                {formatRupiah(val)}
              </button>
            ))}
          </div>
        </div>

        {/* Input manual nominal */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#4A5E3E]">
            Atau ketik nominal <span className="text-[#8A9E7A] font-normal">(min. Rp 1.000)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A9E7A]">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? Number(amount).toLocaleString('id-ID') : ''}
              onChange={handleAmountInput}
              placeholder="0"
              className="w-full rounded-xl border border-[#D8D1C0] bg-white py-2.5 pl-9 pr-4 text-sm font-mono font-semibold text-[#1A2E1A] placeholder:text-[#D8D1C0] outline-none transition-colors focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/15"
            />
          </div>
          {amount && !isValid && (
            <p className="mt-1 text-[11px] text-danger">Nominal minimal Rp 1.000</p>
          )}
        </div>

        {/* Nama donatur */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[#4A5E3E]">
            Nama <span className="text-[#8A9E7A] font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonim"
            maxLength={40}
            className="w-full rounded-xl border border-[#D8D1C0] bg-white px-4 py-2.5 text-sm text-[#1A2E1A] placeholder:text-[#C8C4B8] outline-none transition-colors focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/15"
          />
        </div>

        {/* Pesan */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#4A5E3E]">
            <span>Pesan <span className="text-[#8A9E7A] font-normal">(opsional)</span></span>
            <span className="font-normal text-[#8A9E7A]">{message.length}/200</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis pesanmu untuk tim AeroBlast..."
            maxLength={200}
            rows={3}
            className="w-full resize-none rounded-xl border border-[#D8D1C0] bg-white px-4 py-2.5 text-sm text-[#1A2E1A] placeholder:text-[#C8C4B8] outline-none transition-colors focus:border-[#B4E035]/70 focus:ring-2 focus:ring-[#B4E035]/15"
          />
        </div>

        {/* Preview */}
        {isValid && (
          <div className="rounded-xl border border-[#B4E035]/20 bg-[#B4E035]/[0.06] px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={11} className="text-[#748F1C]" />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#748F1C]">Ringkasan Donasi</span>
            </div>
            <p className="text-xs text-[#4A5E3E]">
              <span className="font-bold text-[#1A2E1A]">{formatRupiah(numAmount)}</span>
              {' '}dari <span className="font-semibold">{name.trim() || 'Anonim'}</span>
            </p>
            {message.trim() && (
              <p className="mt-1 text-[11px] italic text-[#6B7F5A]">"{message.trim()}"</p>
            )}
          </div>
        )}

        <Button fullWidth size="sm" onClick={handleSubmit} disabled={!isValid}>
          <Heart size={13} />
          {isValid ? `Donasi ${formatRupiah(numAmount)} via WhatsApp` : 'Masukkan nominal dulu'}
        </Button>

        <p className="text-center text-[10px] text-[#8A9E7A]">
          Donasi akan dikirim ke Admin via WhatsApp. Tidak ada kewajiban apapun.
        </p>
      </div>
    </div>
  );
}

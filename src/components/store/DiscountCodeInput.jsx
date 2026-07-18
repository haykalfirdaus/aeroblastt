import { useState } from 'react';
import { Tag } from 'lucide-react';
import { checkDiscountCode } from '@/utils/discount';
import { cn } from '@/lib/cn';

export function DiscountCodeInput({ onApply, category }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [checking, setChecking] = useState(false);

  async function handleApply() {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const result = await checkDiscountCode(code, category);
      setMsg(result);
      if (result.valid) onApply(result.percent);
      else onApply(0);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4A5E3E]">
        Kode Diskon (Opsional)
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7F5A]" />
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); onApply(0); }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Contoh: SUMMER25"
            maxLength={30}
            disabled={checking}
            className="w-full rounded-xl border border-[#D8D1C0] bg-[#FAFAF7] pl-9 pr-4 py-3 font-mono text-sm text-[#1A2E1A] placeholder:text-[#8A9E7A] outline-none transition-colors focus:border-[#B4E035]/60 focus:ring-2 focus:ring-[#B4E035]/15 uppercase disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={checking || !code.trim()}
          className="shrink-0 rounded-xl border border-[#B4E035]/40 bg-[#B4E035]/10 px-4 text-sm font-semibold text-[#748F1C] transition hover:bg-[#B4E035]/18 hover:border-[#B4E035]/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checking ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#748F1C]/30 border-t-[#748F1C] inline-block" />
          ) : (
            'Pakai'
          )}
        </button>
      </div>
      {msg && (
        <p className={cn('mt-1.5 text-xs font-medium', msg.valid ? 'text-success-bright' : 'text-danger-bright')}>
          {msg.message}
        </p>
      )}
    </div>
  );
}

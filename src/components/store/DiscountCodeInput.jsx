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
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4a5e3a]">
        Kode Diskon (Opsional)
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a5e3a]" />
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); onApply(0); }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Contoh: SUMMER25"
            maxLength={30}
            disabled={checking}
            className="w-full rounded-md border border-2 border-[#1d2b1f] bg-[#fffdf9] pl-9 pr-4 py-3 font-mono text-sm text-[#1d2b1f] placeholder:text-[#6b7f5a] outline-none transition-colors focus:border-[#BFFF5E]/60 focus:ring-2 focus:ring-[#BFFF5E]/15 uppercase disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={checking || !code.trim()}
          className="shrink-0 rounded-md border border-[#BFFF5E]/40 bg-[#BFFF5E]/10 px-4 text-sm font-semibold text-[#1d2b1f] transition hover:bg-[#BFFF5E]/18 hover:border-[#BFFF5E]/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checking ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-md border-2 border-[#1d2b1f]/30 border-t-[#1d2b1f] inline-block" />
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

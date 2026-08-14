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
          <Tag size={14} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#5a7048]" />
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); onApply(0); }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Contoh: SUMMER25"
            maxLength={30}
            disabled={checking}
            className="neu-field neu-field-icon font-mono text-sm uppercase disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={checking || !code.trim()}
          className="neu-press inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-[var(--radius-neu)] bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] px-5 text-sm font-semibold text-[#1d2b1f] shadow-[var(--neu-out)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {checking ? (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#1d2b1f]/25 border-t-[#1d2b1f]" />
          ) : (
            'Pakai'
          )}
        </button>
      </div>
      {msg && (
        <p className={cn('mt-2 text-xs font-medium', msg.valid ? 'text-[#4a5e3a]' : 'text-[#a3271f]')}>
          {msg.message}
        </p>
      )}
    </div>
  );
}

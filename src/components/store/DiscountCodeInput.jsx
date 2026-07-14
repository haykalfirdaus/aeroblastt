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
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
        Kode Diskon (Opsional)
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(null); onApply(0); }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Contoh: SUMMER25"
            maxLength={30}
            disabled={checking}
            className="w-full rounded-xl border border-white/12 bg-white/[0.04] pl-9 pr-4 py-3 font-mono text-sm text-text-bright placeholder:text-text-faint outline-none transition-colors focus:border-neon-400/60 focus:bg-white/[0.06] uppercase disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={checking || !code.trim()}
          className="shrink-0 rounded-xl border border-neon-500/40 bg-neon-500/10 px-4 text-sm font-semibold text-neon-300 transition hover:bg-neon-500/18 hover:border-neon-400/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {checking ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neon-300/30 border-t-neon-300 inline-block" />
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

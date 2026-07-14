import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const PAYMENT_KEYS = Object.keys(SITE.payment);

export function PaymentMethodPicker({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
        Metode Pembayaran <span className="text-neon-400">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_KEYS.map((key) => {
          const method = SITE.payment[key];
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                'rounded-xl border px-2 py-2.5 text-center transition-all',
                selected
                  ? 'border-neon-400/60 bg-neon-500/15 text-neon-300'
                  : 'border-white/10 bg-white/4 text-text-muted hover:border-white/20 hover:text-text-bright'
              )}
            >
              <span className="block text-xs font-bold">{method.label}</span>
            </button>
          );
        })}
      </div>

      {value && SITE.payment[value]?.imgPath && (
        <div className="mt-3 flex justify-center rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <img
            src={SITE.payment[value].imgPath}
            alt={`${SITE.payment[value].label} AeroBlast Network`}
            className="h-48 w-48 rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}

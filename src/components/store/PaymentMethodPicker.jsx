import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const PAYMENT_KEYS = Object.keys(SITE.payment);

export function PaymentMethodPicker({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4a5e3a]">
        Metode Pembayaran <span className="text-[#4a5e3a]">*</span>
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
              aria-pressed={selected}
              className={cn(
                'min-h-[48px] rounded-[var(--radius-neu)] px-2 py-2.5 text-center transition-transform',
                selected
                  ? 'bg-[#fff8f0] text-[#1d2b1f] shadow-[var(--neu-in)]'
                  : 'neu-press bg-[linear-gradient(145deg,var(--neu-hi),var(--neu-lo))] text-[#4a5e3a] shadow-[var(--neu-out)]'
              )}
            >
              <span className="block text-xs font-bold">{method.label}</span>
            </button>
          );
        })}
      </div>

      {value && SITE.payment[value]?.imgPath && (
        <div className="mt-3 flex justify-center rounded-[var(--radius-neu-lg)] bg-[#fff8f0] p-4 shadow-[var(--neu-in)]">
          <img
            src={SITE.payment[value].imgPath}
            alt={`${SITE.payment[value].label} AeroBlast Network`}
            className="h-48 w-48 rounded-[var(--radius-neu)] object-contain"
          />
        </div>
      )}
    </div>
  );
}

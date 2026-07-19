import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const PAYMENT_KEYS = Object.keys(SITE.payment);

export function PaymentMethodPicker({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4a5e3a]">
        Metode Pembayaran <span className="text-[#BFFF5E]">*</span>
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
                'rounded-md border px-2 py-2.5 text-center transition-all',
                selected
                  ? 'border-[#BFFF5E]/60 bg-[#BFFF5E]/15 text-[#1d2b1f]'
                  : 'border-2 border-[#1d2b1f] bg-[#f5ece0] text-[#4a5e3a] hover:border-[#BFFF5E]/25 hover:text-[#1d2b1f]'
              )}
            >
              <span className="block text-xs font-bold">{method.label}</span>
            </button>
          );
        })}
      </div>

      {value && SITE.payment[value]?.imgPath && (
        <div className="mt-3 flex justify-center rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] p-4">
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

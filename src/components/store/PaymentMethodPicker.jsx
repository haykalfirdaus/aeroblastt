import { SITE } from '@/data/config';
import { cn } from '@/lib/cn';

const PAYMENT_KEYS = Object.keys(SITE.payment);

export function PaymentMethodPicker({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#4A5E3E]">
        Metode Pembayaran <span className="text-[#B4E035]">*</span>
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
                  ? 'border-[#B4E035]/60 bg-[#B4E035]/15 text-[#748F1C]'
                  : 'border-[#D8D1C0] bg-[#F0EBE0] text-[#4A5E3E] hover:border-[#B4E035]/25 hover:text-[#1A2E1A]'
              )}
            >
              <span className="block text-xs font-bold">{method.label}</span>
            </button>
          );
        })}
      </div>

      {value && SITE.payment[value]?.imgPath && (
        <div className="mt-3 flex justify-center rounded-xl border border-[#D8D1C0] bg-[#F5F2EA] p-4">
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

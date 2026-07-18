import { formatRupiah } from '@/utils/currency';
import { cn } from '@/lib/cn';

export function PriceSummary({ basePrice, discountPercent = 0, className }) {
  const savings = Math.floor(basePrice * (discountPercent / 100));
  const finalPrice = basePrice - savings;
  const hasDiscount = discountPercent > 0;

  return (
    <div className={cn('rounded-xl border border-[#D8D1C0] bg-[#F5F2EA] divide-y divide-[#D8D1C0]', className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-[#4A5E3E]">Harga Normal</span>
        <span className={cn('font-mono text-sm font-semibold', hasDiscount ? 'text-[#8A9E7A] line-through' : 'text-[#1A2E1A]')}>
          {formatRupiah(basePrice)}
        </span>
      </div>
      {hasDiscount && (
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-success-bright">Diskon {discountPercent}%</span>
          <span className="font-mono text-sm font-semibold text-success-bright">- {formatRupiah(savings)}</span>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-bold text-[#1A2E1A]">Total Bayar</span>
        <span className="font-mono text-lg font-bold text-[#748F1C]">{formatRupiah(finalPrice)}</span>
      </div>
    </div>
  );
}

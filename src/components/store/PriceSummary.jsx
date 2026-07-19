import { formatRupiah } from '@/utils/currency';
import { cn } from '@/lib/cn';

export function PriceSummary({ basePrice, discountPercent = 0, className }) {
  const savings = Math.floor(basePrice * (discountPercent / 100));
  const finalPrice = basePrice - savings;
  const hasDiscount = discountPercent > 0;

  return (
    <div className={cn('rounded-md border border-2 border-[#1d2b1f] bg-[#faf3e8] divide-y divide-[#D8D1C0]', className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-[#4a5e3a]">Harga Normal</span>
        <span className={cn('font-mono text-sm font-semibold', hasDiscount ? 'text-[#6b7f5a] line-through' : 'text-[#1d2b1f]')}>
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
        <span className="text-sm font-bold text-[#1d2b1f]">Total Bayar</span>
        <span className="font-mono text-lg font-bold text-[#1d2b1f]">{formatRupiah(finalPrice)}</span>
      </div>
    </div>
  );
}

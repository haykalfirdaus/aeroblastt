import { formatRupiah } from '@/utils/currency';
import { cn } from '@/lib/cn';

export function PriceSummary({ basePrice, discountPercent = 0, className }) {
  const savings = Math.floor(basePrice * (discountPercent / 100));
  const finalPrice = basePrice - savings;
  const hasDiscount = discountPercent > 0;

  return (
    <div className={cn('rounded-[var(--radius-neu-lg)] bg-[#fff8f0] shadow-[var(--neu-in)] px-1 py-1', className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-[#4a5e3a]">Harga Normal</span>
        <span className={cn('font-mono text-sm font-semibold', hasDiscount ? 'text-[#5a7048] line-through' : 'text-[#1d2b1f]')}>
          {formatRupiah(basePrice)}
        </span>
      </div>
      {hasDiscount && (
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-[#4a5e3a]">Diskon {discountPercent}%</span>
          <span className="font-mono text-sm font-semibold text-[#4a5e3a]">- {formatRupiah(savings)}</span>
        </div>
      )}
      <div className="neu-rule mx-4" />
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-bold text-[#1d2b1f]">Total Bayar</span>
        <span className="font-mono text-lg font-bold text-[#1d2b1f]">{formatRupiah(finalPrice)}</span>
      </div>
    </div>
  );
}

import { formatRupiah } from '@/utils/currency';
import { cn } from '@/lib/cn';

export function PriceSummary({ basePrice, discountPercent = 0, className }) {
  const savings = Math.floor(basePrice * (discountPercent / 100));
  const finalPrice = basePrice - savings;
  const hasDiscount = discountPercent > 0;

  return (
    <div className={cn('rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/8', className)}>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-text-muted">Harga Normal</span>
        <span className={cn('font-mono text-sm font-semibold', hasDiscount ? 'text-text-dim line-through' : 'text-text-bright')}>
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
        <span className="text-sm font-bold text-text-bright">Total Bayar</span>
        <span className="font-mono text-lg font-bold text-neon-300">{formatRupiah(finalPrice)}</span>
      </div>
    </div>
  );
}

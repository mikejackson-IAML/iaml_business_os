'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/dashboard-kit/lib/utils';
import { type DateRange } from '../utils/date-range';

// Re-export for convenience
export { parseDateRange, rangeToDays, type DateRange } from '../utils/date-range';

const ranges = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
] as const;

interface DateRangeSelectorProps {
  currentRange: DateRange;
  className?: string;
}

export function DateRangeSelector({ currentRange, className }: DateRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRangeChange = (value: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
      {ranges.map((r) => (
        <button
          key={r.value}
          onClick={() => handleRangeChange(r.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            currentRange === r.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

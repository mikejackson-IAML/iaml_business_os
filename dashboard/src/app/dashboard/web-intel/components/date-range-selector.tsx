'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/dashboard-kit/lib/utils';

const ranges = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
] as const;

export type DateRange = '7d' | '30d' | '90d';

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

/**
 * Parse date range from URL or return default
 */
export function parseDateRange(range: string | undefined): DateRange {
  if (range === '7d' || range === '30d' || range === '90d') {
    return range;
  }
  return '30d'; // Default
}

/**
 * Convert date range to days number
 */
export function rangeToDays(range: DateRange): number {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
  }
}

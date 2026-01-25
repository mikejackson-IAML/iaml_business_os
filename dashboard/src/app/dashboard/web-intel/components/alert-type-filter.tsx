'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/dashboard-kit/lib/utils';
import { type AlertTypeFilterValue } from '../utils/filters';

// Re-export for convenience
export { parseAlertTypeFilter, type AlertTypeFilterValue } from '../utils/filters';

interface AlertTypeFilterProps {
  currentType: AlertTypeFilterValue;
  counts: {
    all: number;
    traffic: number;
    ranking: number;
    technical: number;
  };
  className?: string;
}

const filterOptions: { value: AlertTypeFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'technical', label: 'Technical' },
];

export function AlertTypeFilter({ currentType, counts, className }: AlertTypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: AlertTypeFilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('alertType');
    } else {
      params.set('alertType', value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {filterOptions.map((option) => {
        const count = counts[option.value];
        const isActive = currentType === option.value;

        return (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {option.label} ({count})
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/dashboard-kit/lib/utils';

export type RecommendationPriorityFilterValue = 'all' | 'high' | 'medium' | 'low';

/**
 * Parse URL param to RecommendationPriorityFilterValue
 */
export function parseRecommendationPriorityFilter(
  value: string | undefined
): RecommendationPriorityFilterValue {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'all';
}

interface RecommendationPriorityFilterProps {
  currentPriority: RecommendationPriorityFilterValue;
  counts: {
    all: number;
    high: number;
    medium: number;
    low: number;
  };
  className?: string;
}

const filterOptions: { value: RecommendationPriorityFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function RecommendationPriorityFilter({
  currentPriority,
  counts,
  className,
}: RecommendationPriorityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: RecommendationPriorityFilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('recPriority');
    } else {
      params.set('recPriority', value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {filterOptions.map((option) => {
        const count = counts[option.value];
        const isActive = currentPriority === option.value;

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

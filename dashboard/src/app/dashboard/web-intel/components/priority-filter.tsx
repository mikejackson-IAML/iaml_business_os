'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/dashboard-kit/lib/utils';

/**
 * Valid keyword priority filter values
 */
export type KeywordPriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

/**
 * Parse priority filter from URL or return default
 */
export function parsePriorityFilter(value: string | undefined): KeywordPriorityFilter {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'all';
}

const priorities: Array<{ value: KeywordPriorityFilter; label: string }> = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

interface PriorityFilterProps {
  currentPriority: KeywordPriorityFilter;
  className?: string;
}

/**
 * Dropdown filter for keyword priority levels.
 * Uses URL state for shareable, persistent filtering.
 */
export function PriorityFilter({ currentPriority, className }: PriorityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      // Remove priority param when set to 'all' (default)
      params.delete('priority');
    } else {
      params.set('priority', value);
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <select
      value={currentPriority}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        'px-4 py-2 border border-border rounded-lg text-sm bg-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      {priorities.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}

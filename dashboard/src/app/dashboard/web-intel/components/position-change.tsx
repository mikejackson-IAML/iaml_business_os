'use client';

import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';

interface PositionChangeProps {
  /**
   * Position change value:
   * - Positive = dropped (position went from 5 to 10 = +5)
   * - Negative = improved (position went from 10 to 5 = -5)
   * - null/0 = no change
   */
  change: number | null;
  className?: string;
}

/**
 * Visual indicator for ranking position changes.
 * Shows green arrow up for improvements, red arrow down for drops.
 * Displays warning icon for dramatic drops (10+ positions).
 */
export function PositionChange({ change, className }: PositionChangeProps) {
  // No change or null - show dash
  if (change === null || change === 0) {
    return (
      <span className={cn('text-muted-foreground', className)}>
        &mdash;
      </span>
    );
  }

  const isImprovement = change < 0; // Lower position number = better ranking
  const isDramaticDrop = change >= 10; // Dropped 10+ positions
  const absChange = Math.abs(change);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium',
        isImprovement ? 'text-success' : 'text-error',
        className
      )}
    >
      {isDramaticDrop && (
        <AlertTriangle className="h-3.5 w-3.5" />
      )}
      {isImprovement ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5" />
      )}
      <span>
        {isImprovement ? '+' : '-'}{absChange}
      </span>
    </span>
  );
}

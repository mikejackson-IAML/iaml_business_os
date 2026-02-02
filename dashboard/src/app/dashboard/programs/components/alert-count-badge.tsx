import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';

interface AlertCountBadgeProps {
  warningCount: number;
  criticalCount: number;
  className?: string;
}

/**
 * Displays alert counts with icons for warnings and criticals.
 * Returns null if both counts are 0.
 * Per CONTEXT.md: Warning=yellow/triangle, Critical=red/exclamation
 */
export function AlertCountBadge({ warningCount, criticalCount, className }: AlertCountBadgeProps) {
  if (warningCount === 0 && criticalCount === 0) return null;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {criticalCount > 0 && (
        <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{criticalCount}</span>
        </span>
      )}
      {warningCount > 0 && (
        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{warningCount}</span>
        </span>
      )}
    </div>
  );
}

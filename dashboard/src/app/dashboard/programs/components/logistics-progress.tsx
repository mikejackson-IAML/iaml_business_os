import { Progress } from '@/dashboard-kit/components/ui/progress';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';

interface LogisticsProgressProps {
  completed: number;
  total: number;
  warnings?: number;
  className?: string;
}

/**
 * Displays logistics readiness as "X/Y - Z warnings" format
 * Shows progress bar with color coding
 */
export function LogisticsProgress({ completed, total, warnings = 0, className }: LogisticsProgressProps) {
  const percent = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && warnings === 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress
        value={percent}
        className="h-2 w-16"
        indicatorClassName={cn(
          percent >= 80 ? 'bg-emerald-500' :
          percent >= 60 ? 'bg-amber-500' :
          'bg-red-500'
        )}
      />
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {completed}/{total}
      </span>
      {warnings > 0 ? (
        <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5" />
          {warnings} {warnings === 1 ? 'warning' : 'warnings'}
        </span>
      ) : isComplete ? (
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      ) : null}
    </div>
  );
}

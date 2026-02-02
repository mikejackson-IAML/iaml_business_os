import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/dashboard-kit/lib/utils';
import type { ProgramAlert } from '@/lib/api/program-alerts';

interface AlertBreakdownProps {
  alerts: ProgramAlert[];
  className?: string;
}

/**
 * Displays full list of alerts with severity icons and messages.
 * Used in program detail header to show what needs attention.
 */
export function AlertBreakdown({ alerts, className }: AlertBreakdownProps) {
  if (alerts.length === 0) return null;

  // Sort criticals first
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.severity === 'critical' && b.severity === 'warning') return -1;
    if (a.severity === 'warning' && b.severity === 'critical') return 1;
    return 0;
  });

  return (
    <div className={cn('space-y-1.5', className)}>
      {sortedAlerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'flex items-start gap-2 text-sm',
            alert.severity === 'critical'
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400'
          )}
        >
          {alert.severity === 'critical' ? (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

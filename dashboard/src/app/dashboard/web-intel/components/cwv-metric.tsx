import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';

type CwvStatus = 'good' | 'needs_work' | 'poor';

interface CwvMetricProps {
  label: string;
  value: number | null;
  className?: string;
}

function getStatus(value: number): CwvStatus {
  if (value >= 75) return 'good';
  if (value >= 50) return 'needs_work';
  return 'poor';
}

function getStatusLabel(status: CwvStatus): string {
  switch (status) {
    case 'good':
      return 'Good';
    case 'needs_work':
      return 'Needs Work';
    case 'poor':
      return 'Poor';
  }
}

function getStatusVariant(status: CwvStatus): 'healthy' | 'warning' | 'critical' {
  switch (status) {
    case 'good':
      return 'healthy';
    case 'needs_work':
      return 'warning';
    case 'poor':
      return 'critical';
  }
}

export function CwvMetric({ label, value, className }: CwvMetricProps) {
  const status = value !== null ? getStatus(value) : null;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold">
          {value !== null ? `${value.toFixed(1)}%` : '-'}
        </span>
        {status && (
          <Badge variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        )}
      </div>
    </div>
  );
}

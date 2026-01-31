import { Badge } from '@/dashboard-kit/components/ui/badge';

interface ProgramStatusBadgeProps {
  enrolledCount: number;
  showCount?: boolean;
  className?: string;
}

/**
 * Displays GO/CLOSE/NEEDS status based on registration count
 * GO = 6+ registrations (green/healthy)
 * CLOSE = 4-5 registrations (yellow/warning)
 * NEEDS = 0-3 registrations (red/critical)
 */
export function ProgramStatusBadge({ enrolledCount, showCount = true, className }: ProgramStatusBadgeProps) {
  let variant: 'healthy' | 'warning' | 'critical';
  let label: string;

  if (enrolledCount >= 6) {
    variant = 'healthy';
    label = 'GO';
  } else if (enrolledCount >= 4) {
    variant = 'warning';
    label = 'CLOSE';
  } else {
    variant = 'critical';
    label = 'NEEDS';
  }

  return (
    <Badge variant={variant} className={className}>
      {label}{showCount && ` | ${enrolledCount}`}
    </Badge>
  );
}

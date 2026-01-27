import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';

interface StatusBadgeProps {
  status: string;
  isVip?: boolean;
}

const statusColors: Record<string, string> = {
  customer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  prospect: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function StatusBadge({ status, isVip }: StatusBadgeProps) {
  const colorClass = statusColors[status.toLowerCase()] ?? statusColors.inactive;

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={cn('capitalize border-0', colorClass)}>
        {status}
      </Badge>
      {isVip && (
        <Badge
          variant="outline"
          className="border-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          VIP
        </Badge>
      )}
    </div>
  );
}

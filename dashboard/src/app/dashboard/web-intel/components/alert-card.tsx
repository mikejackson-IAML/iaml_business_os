'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/dashboard-kit/lib/utils';
import { acknowledgeAlertAction } from '../actions';

type Severity = 'info' | 'warning' | 'critical';

interface AlertCardProps {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  createdAt: Date;
  onDismiss?: (id: string) => void;
  className?: string;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
  },
};

export function AlertCard({
  id,
  title,
  message,
  severity,
  createdAt,
  onDismiss,
  className,
}: AlertCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const config = severityConfig[severity];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsDismissing(true);
    startTransition(async () => {
      const result = await acknowledgeAlertAction(id);
      if (result.success) {
        onDismiss?.(id);
      } else {
        console.error('Failed to dismiss alert:', result.error);
        setIsDismissing(false);
      }
    });
  };

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg bg-card border transition-all',
        isDismissing && 'opacity-50 scale-95',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-3">
        {/* Severity Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            {formatRelativeTime(createdAt)}
          </p>
        </div>

        {/* Dismiss Button - appears on hover */}
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className={cn(
              'p-1 rounded-md transition-opacity',
              'hover:bg-muted text-muted-foreground hover:text-foreground',
              isHovered || isPending ? 'opacity-100' : 'opacity-0'
            )}
            aria-label="Dismiss alert"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCardSkeleton } from '../ui/skeleton';
import { formatRelativeTime } from '../../lib/utils';
import type { AlertItem } from '../../types';

interface AlertListProps {
  alerts: AlertItem[];
  title?: string;
  maxItems?: number;
  isLoading?: boolean;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onDismiss?: (alertId: string) => void;
  onAction?: (alert: AlertItem) => void;
  className?: string;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    containerClass: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20',
    iconClass: 'text-red-500',
    badgeVariant: 'critical' as const,
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
    iconClass: 'text-amber-500',
    badgeVariant: 'warning' as const,
  },
  info: {
    icon: Info,
    containerClass: 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
    iconClass: 'text-blue-500',
    badgeVariant: 'info' as const,
  },
};

export function AlertList({
  alerts,
  title = 'Alerts',
  maxItems = 5,
  isLoading = false,
  showViewAll = true,
  onViewAll,
  onDismiss,
  onAction,
  className,
}: AlertListProps) {
  const displayedAlerts = alerts.slice(0, maxItems);
  const hasMore = alerts.length > maxItems;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AlertCardSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No alerts at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {title}
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          {showViewAll && hasMore && onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View all
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                'rounded-lg p-3 transition-colors',
                config.containerClass
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClass)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                      )}
                    </div>
                    {alert.dismissable && onDismiss && (
                      <button
                        onClick={() => onDismiss(alert.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {alert.category && (
                      <Badge variant="outline" className="text-xs">
                        {alert.category}
                      </Badge>
                    )}
                    {alert.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    )}
                    {alert.actionLabel && onAction && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => onAction(alert)}
                      >
                        {alert.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Compact alert card for dashboards
interface AlertCardProps {
  alert: AlertItem;
  onDismiss?: () => void;
  onAction?: () => void;
  className?: string;
}

export function AlertCard({ alert, onDismiss, onAction, className }: AlertCardProps) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg p-4 border',
        config.containerClass,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0', config.iconClass)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{alert.title}</p>
          {alert.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {alert.description}
            </p>
          )}
          {alert.actionLabel && onAction && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs mt-2"
              onClick={onAction}
            >
              {alert.actionLabel} →
            </Button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default AlertList;

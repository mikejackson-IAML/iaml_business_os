'use client';

import * as React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatRelativeTime } from '../../lib/utils';

type PlatformStatusType = 'operational' | 'degraded' | 'down' | 'rate_limited' | 'maintenance';

interface PlatformInfo {
  id: string;
  name: string;
  displayName: string;
  status: PlatformStatusType;
  description?: string;
  creditsRemaining?: number;
  creditsTotal?: number;
  dailyLimitUsed?: number;
  dailyLimitTotal?: number;
  lastSyncAt?: Date;
  errorMessage?: string;
}

interface PlatformStatusProps {
  platforms: PlatformInfo[];
  title?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onPlatformClick?: (platform: PlatformInfo) => void;
  className?: string;
}

const statusConfig: Record<PlatformStatusType, {
  icon: typeof CheckCircle;
  label: string;
  badgeVariant: 'healthy' | 'warning' | 'critical' | 'secondary';
  iconClass: string;
}> = {
  operational: {
    icon: CheckCircle,
    label: 'Operational',
    badgeVariant: 'healthy',
    iconClass: 'text-emerald-500',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degraded',
    badgeVariant: 'warning',
    iconClass: 'text-amber-500',
  },
  down: {
    icon: XCircle,
    label: 'Down',
    badgeVariant: 'critical',
    iconClass: 'text-red-500',
  },
  rate_limited: {
    icon: Clock,
    label: 'Rate Limited',
    badgeVariant: 'warning',
    iconClass: 'text-amber-500',
  },
  maintenance: {
    icon: RefreshCw,
    label: 'Maintenance',
    badgeVariant: 'secondary',
    iconClass: 'text-blue-500',
  },
};

export function PlatformStatus({
  platforms,
  title = 'Platform Status',
  isLoading = false,
  onRefresh,
  onPlatformClick,
  className,
}: PlatformStatusProps) {
  const allOperational = platforms.every((p) => p.status === 'operational');

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {allOperational ? (
              <Badge variant="healthy">All Systems Operational</Badge>
            ) : (
              <Badge variant="warning">Issues Detected</Badge>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isLoading && 'animate-spin')}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => {
          const config = statusConfig[platform.status];
          const Icon = config.icon;
          const hasUsageInfo =
            platform.creditsRemaining !== undefined ||
            platform.dailyLimitUsed !== undefined;

          return (
            <div
              key={platform.id}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                platform.status === 'operational'
                  ? 'border-border'
                  : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
                onPlatformClick && 'cursor-pointer hover:bg-muted/50'
              )}
              onClick={() => onPlatformClick?.(platform)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-5 w-5', config.iconClass)} />
                  <div>
                    <p className="font-medium text-sm">{platform.displayName}</p>
                    {platform.description && (
                      <p className="text-xs text-muted-foreground">
                        {platform.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={config.badgeVariant}>{config.label}</Badge>
              </div>

              {platform.errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                  {platform.errorMessage}
                </p>
              )}

              {hasUsageInfo && (
                <div className="space-y-2">
                  {platform.creditsRemaining !== undefined &&
                    platform.creditsTotal !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Credits</span>
                          <span>
                            {platform.creditsRemaining.toLocaleString()} /{' '}
                            {platform.creditsTotal.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={
                            (platform.creditsRemaining / platform.creditsTotal) *
                            100
                          }
                          className="h-1"
                        />
                      </div>
                    )}

                  {platform.dailyLimitUsed !== undefined &&
                    platform.dailyLimitTotal !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            Daily Limit
                          </span>
                          <span>
                            {platform.dailyLimitUsed.toLocaleString()} /{' '}
                            {platform.dailyLimitTotal.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={
                            (platform.dailyLimitUsed / platform.dailyLimitTotal) *
                            100
                          }
                          className="h-1"
                        />
                      </div>
                    )}
                </div>
              )}

              {platform.lastSyncAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last sync: {formatRelativeTime(platform.lastSyncAt)}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Compact platform status row for inline display
interface PlatformStatusRowProps {
  platform: PlatformInfo;
  onClick?: () => void;
  className?: string;
}

export function PlatformStatusRow({
  platform,
  onClick,
  className,
}: PlatformStatusRowProps) {
  const config = statusConfig[platform.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center justify-between py-2',
        onClick && 'cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', config.iconClass)} />
        <span className="text-sm">{platform.displayName}</span>
      </div>
      <Badge variant={config.badgeVariant} className="text-xs">
        {config.label}
      </Badge>
    </div>
  );
}

export default PlatformStatus;

'use client';

import * as React from 'react';
import {
  UserPlus,
  FileText,
  CheckCircle,
  AlertCircle,
  Package,
  Mail,
  Calendar,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ActivityItemSkeleton } from '../ui/skeleton';
import { formatRelativeTime } from '../../lib/utils';
import type { ActivityItem } from '../../types';

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  isLoading?: boolean;
  showTimestamp?: boolean;
  onItemClick?: (activity: ActivityItem) => void;
  className?: string;
}

// Map activity types to icons
const activityIcons: Record<string, LucideIcon> = {
  registration: UserPlus,
  faculty_confirmation: CheckCircle,
  materials_shipped: Package,
  shrm_approval: FileText,
  room_block_update: Calendar,
  email_sent: Mail,
  settings_changed: Settings,
  alert: AlertCircle,
  default: FileText,
};

// Map activity types to colors
const activityColors: Record<string, string> = {
  registration: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  faculty_confirmation: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  materials_shipped: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  shrm_approval: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  room_block_update: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  email_sent: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  alert: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function ActivityFeed({
  activities,
  title = 'Recent Activity',
  maxItems = 10,
  isLoading = false,
  showTimestamp = true,
  onItemClick,
  className,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <ActivityItemSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

          {/* Activity items */}
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || activityIcons.default;
              const colorClass = activityColors[activity.type] || activityColors.default;
              const isClickable = !!onItemClick;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'relative flex gap-3 pl-1',
                    isClickable && 'cursor-pointer hover:bg-muted/50 rounded-lg p-2 -ml-2 transition-colors'
                  )}
                  onClick={isClickable ? () => onItemClick(activity) : undefined}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                      colorClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm">
                      <span className="font-medium">{activity.title}</span>
                      {activity.user && (
                        <span className="text-muted-foreground"> by {activity.user}</span>
                      )}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {activity.description}
                      </p>
                    )}
                    {showTimestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact activity item for inline use
interface ActivityItemDisplayProps {
  activity: ActivityItem;
  showTimestamp?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ActivityItemDisplay({
  activity,
  showTimestamp = true,
  onClick,
  className,
}: ActivityItemDisplayProps) {
  const Icon = activityIcons[activity.type] || activityIcons.default;
  const colorClass = activityColors[activity.type] || activityColors.default;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2',
        onClick && 'cursor-pointer hover:bg-muted/50 rounded-lg transition-colors',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0',
          colorClass
        )}
      >
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{activity.title}</p>
        {showTimestamp && (
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(activity.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;

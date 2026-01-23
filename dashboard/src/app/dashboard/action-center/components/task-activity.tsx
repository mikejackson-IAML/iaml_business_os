'use client';

import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Workflow,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import type { TaskActivity } from '@/lib/api/task-types';
import { formatDistanceToNow } from 'date-fns';

// ==================== Activity Type Configuration ====================

interface ActivityConfigItem {
  icon: LucideIcon;
  color: string;
  label: string;
}

const activityConfig: Record<string, ActivityConfigItem> = {
  created: {
    icon: Activity,
    color: 'text-blue-500',
    label: 'Task created',
  },
  status_changed: {
    icon: Clock,
    color: 'text-amber-500',
    label: 'Status changed',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    label: 'Completed',
  },
  dismissed: {
    icon: XCircle,
    color: 'text-gray-500',
    label: 'Dismissed',
  },
  priority_changed: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    label: 'Priority changed',
  },
  comment_added: {
    icon: MessageSquare,
    color: 'text-blue-500',
    label: 'Comment added',
  },
  assigned: {
    icon: User,
    color: 'text-purple-500',
    label: 'Assigned',
  },
  workflow_changed: {
    icon: Workflow,
    color: 'text-cyan-500',
    label: 'Workflow updated',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-500',
    label: 'Rejected',
  },
  modified: {
    icon: Activity,
    color: 'text-amber-500',
    label: 'Modified & Approved',
  },
};

// Default config for unknown activity types
const defaultActivityConfig: ActivityConfigItem = {
  icon: Activity,
  color: 'text-gray-500',
  label: 'Activity',
};

// ==================== ActivityItem Component ====================

interface ActivityItemProps {
  activity: TaskActivity;
}

/**
 * ActivityItem - Displays a single activity item with icon, description, and timestamp
 */
function ActivityItem({ activity }: ActivityItemProps) {
  // Get config for this activity type, with fallback for unknown types
  const config = activityConfig[activity.activity_type] || {
    ...defaultActivityConfig,
    label: activity.activity_type.replace(/_/g, ' '),
  };

  const Icon = config.icon;

  // Build description based on activity type
  const buildDescription = () => {
    switch (activity.activity_type) {
      case 'status_changed':
      case 'priority_changed':
        if (activity.old_value && activity.new_value) {
          return (
            <>
              <span className="text-muted-foreground">{activity.old_value}</span>
              <span className="mx-1 text-muted-foreground/50">&rarr;</span>
              <span className="font-medium">{activity.new_value}</span>
            </>
          );
        }
        if (activity.new_value) {
          return <span className="font-medium">{activity.new_value}</span>;
        }
        return null;

      default:
        if (activity.new_value) {
          return <span className="text-muted-foreground">{activity.new_value}</span>;
        }
        return null;
    }
  };

  // Get actor display name
  const actorName = activity.actor_name || activity.actor_type || 'System';

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Icon with colored background */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{config.label}</p>
          <time className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </time>
        </div>

        {/* Description (old -> new values or just new value) */}
        {buildDescription() && (
          <p className="text-sm mt-0.5">{buildDescription()}</p>
        )}

        {/* Actor */}
        <p className="text-xs text-muted-foreground mt-1">
          by {actorName}
        </p>
      </div>
    </div>
  );
}

// ==================== TaskActivityList Component ====================

interface TaskActivityListProps {
  activity: TaskActivity[];
}

/**
 * TaskActivityList - Displays a list of task activity items
 * Shows empty state when no activity exists.
 * Activity items are assumed to be sorted by API (most recent first).
 */
export function TaskActivityList({ activity }: TaskActivityListProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {activity.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No activity recorded</p>
          </div>
        ) : (
          // Activity list
          <div className="divide-y divide-border">
            {activity.map((item) => (
              <ActivityItem key={item.id} activity={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

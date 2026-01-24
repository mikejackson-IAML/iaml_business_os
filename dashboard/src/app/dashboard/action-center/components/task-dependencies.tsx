'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaskExtended } from '@/lib/api/task-types';
import { getTaskDependenciesAction } from '../actions';

// Props for TaskDependencies component
interface TaskDependenciesProps {
  taskId: string;
  blockedByCount: number;
  blockingCount: number;
}

// Status configuration for dependency items
const statusConfig = {
  open: { icon: Clock, color: 'text-amber-500', text: 'Open' },
  in_progress: { icon: Clock, color: 'text-blue-500', text: 'In Progress' },
  waiting: { icon: Clock, color: 'text-yellow-500', text: 'Waiting' },
  done: { icon: CheckCircle2, color: 'text-green-500', text: 'Done' },
  dismissed: { icon: XCircle, color: 'text-gray-500', text: 'Dismissed' },
};

// Priority configuration for visual indicators
const priorityConfig = {
  critical: { color: 'bg-red-500' },
  high: { color: 'bg-orange-500' },
  normal: { color: 'bg-gray-400' },
  low: { color: 'bg-blue-500' },
};

/**
 * DependencyItem - Renders a single dependency task row
 */
function DependencyItem({ task }: { task: TaskExtended }) {
  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.open;
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal;
  const StatusIcon = status.icon;
  const isComplete = task.status === 'done' || task.status === 'dismissed';

  return (
    <li className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
      {/* Status Icon */}
      <StatusIcon className={cn('h-4 w-4 flex-shrink-0', status.color)} />

      {/* Priority Indicator */}
      <span
        className={cn('w-2 h-2 rounded-full flex-shrink-0', priority.color)}
        title={`${task.priority} priority`}
      />

      {/* Task Link */}
      <Link
        href={`/dashboard/action-center/tasks/${task.id}`}
        className={cn(
          'flex-1 text-sm hover:underline truncate',
          isComplete ? 'text-muted-foreground line-through' : 'text-foreground'
        )}
      >
        {task.title}
      </Link>

      {/* Status Badge */}
      <Badge
        variant={isComplete ? 'secondary' : task.status === 'in_progress' ? 'info' : 'outline'}
        className="text-xs flex-shrink-0"
      >
        {status.text}
      </Badge>
    </li>
  );
}

/**
 * CollapsibleSection - Renders a collapsible section header with content
 */
function CollapsibleSection({
  title,
  count,
  isExpanded,
  onToggle,
  children,
  variant = 'default',
}: {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'info';
}) {
  const variantStyles = {
    default: '',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 px-1 text-left hover:bg-muted/30 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={cn('font-medium text-sm', variantStyles[variant])}>
            {title}
          </span>
          <Badge variant={variant === 'warning' ? 'warning' : variant === 'info' ? 'info' : 'secondary'} className="text-xs">
            {count}
          </Badge>
        </div>
      </button>

      {isExpanded && (
        <div className="pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * TaskDependencies - Shows Blocked By and Blocking sections with actual task links
 *
 * Implements DEP-04 (Blocked By) and DEP-05 (Blocking) requirements:
 * - Shows both dependency directions
 * - Each item is a clickable link with status indicator
 * - Distinguishes complete vs incomplete dependencies
 */
export function TaskDependencies({ taskId, blockedByCount, blockingCount }: TaskDependenciesProps) {
  // State for dependencies data
  const [blockedBy, setBlockedBy] = useState<TaskExtended[]>([]);
  const [blocking, setBlocking] = useState<TaskExtended[]>([]);

  // State for UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedByExpanded, setBlockedByExpanded] = useState(blockedByCount > 0);
  const [blockingExpanded, setBlockingExpanded] = useState(blockingCount > 0);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Check if we need to fetch at all
  const shouldFetch = blockedByCount > 0 || blockingCount > 0;

  // Fetch dependencies
  const fetchDependencies = useCallback(async () => {
    if (!shouldFetch) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getTaskDependenciesAction(taskId);

      if (result.success && result.data) {
        setBlockedBy((result.data.blockedBy || []) as TaskExtended[]);
        setBlocking((result.data.blocking || []) as TaskExtended[]);
        setHasLoaded(true);
      } else {
        setError(result.error || 'Failed to load dependencies');
      }
    } catch (err) {
      console.error('Error fetching dependencies:', err);
      setError('Failed to load dependencies');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, shouldFetch]);

  // Fetch on mount if needed
  useEffect(() => {
    if (shouldFetch && !hasLoaded) {
      fetchDependencies();
    }
  }, [shouldFetch, hasLoaded, fetchDependencies]);

  // Don't render if no dependencies
  if (!shouldFetch) {
    return null;
  }

  // Count completed vs incomplete blocked-by tasks
  const blockedByComplete = blockedBy.filter(t => t.status === 'done' || t.status === 'dismissed').length;
  const blockedByIncomplete = blockedBy.length - blockedByComplete;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          Dependencies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && !hasLoaded && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading dependencies...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDependencies}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Retry
            </Button>
          </div>
        )}

        {/* Dependencies Content */}
        {hasLoaded && !error && (
          <div className="space-y-0">
            {/* Blocked By Section */}
            {blockedByCount > 0 && (
              <CollapsibleSection
                title="Blocked By"
                count={blockedByCount}
                isExpanded={blockedByExpanded}
                onToggle={() => setBlockedByExpanded(!blockedByExpanded)}
                variant="warning"
              >
                {blockedBy.length > 0 ? (
                  <>
                    {/* Summary indicator */}
                    {blockedByIncomplete > 0 ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 px-3 mb-2">
                        {blockedByIncomplete} task{blockedByIncomplete !== 1 ? 's' : ''} must complete before this task can proceed
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 dark:text-green-400 px-3 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        All dependencies complete
                      </p>
                    )}
                    <ul className="space-y-1">
                      {blockedBy.map((task) => (
                        <DependencyItem key={task.id} task={task} />
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    No blocking tasks found
                  </p>
                )}
              </CollapsibleSection>
            )}

            {/* Blocking Section */}
            {blockingCount > 0 && (
              <CollapsibleSection
                title="Blocking"
                count={blockingCount}
                isExpanded={blockingExpanded}
                onToggle={() => setBlockingExpanded(!blockingExpanded)}
                variant="info"
              >
                {blocking.length > 0 ? (
                  <>
                    <p className="text-xs text-blue-600 dark:text-blue-400 px-3 mb-2">
                      These tasks are waiting for this task to complete
                    </p>
                    <ul className="space-y-1">
                      {blocking.map((task) => (
                        <DependencyItem key={task.id} task={task} />
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    No dependent tasks found
                  </p>
                )}
              </CollapsibleSection>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

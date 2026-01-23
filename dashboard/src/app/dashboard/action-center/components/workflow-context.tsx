'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Workflow,
  CheckCircle,
  Circle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import type { TaskExtended } from '@/lib/api/task-types';

interface WorkflowContextProps {
  task: TaskExtended;
  workflowTasks?: TaskExtended[];
}

// Config for workflow status display
const workflowStatusConfig: Record<string, { text: string; variant: 'healthy' | 'warning' | 'info' | 'secondary' | 'critical' }> = {
  active: { text: 'Active', variant: 'info' },
  in_progress: { text: 'In Progress', variant: 'info' },
  paused: { text: 'Paused', variant: 'warning' },
  completed: { text: 'Completed', variant: 'healthy' },
  cancelled: { text: 'Cancelled', variant: 'secondary' },
  failed: { text: 'Failed', variant: 'critical' },
};

/**
 * WorkflowContext - Shows workflow progress and sibling tasks
 * Displays when a task belongs to a workflow, showing:
 * - Link to parent workflow
 * - Progress indicator
 * - Collapsible list of workflow tasks
 */
export function WorkflowContext({ task, workflowTasks }: WorkflowContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only render if task has a workflow
  if (!task.workflow_id) {
    return null;
  }

  // Calculate progress from workflowTasks
  const completedTasks = workflowTasks?.filter(
    (t) => t.status === 'done' || t.status === 'dismissed'
  ).length ?? 0;
  const totalTasks = workflowTasks?.length ?? 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get status config
  const statusKey = task.workflow_status?.toLowerCase().replace(/\s+/g, '_') || 'active';
  const statusConfig = workflowStatusConfig[statusKey] || workflowStatusConfig.active;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          Part of Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workflow Name and Status */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/dashboard/action-center/workflows/${task.workflow_id}`}
            className="text-primary hover:underline font-medium flex-1"
          >
            {task.workflow_name || 'View Workflow'}
          </Link>
          {task.workflow_status && (
            <Badge variant={statusConfig.variant}>
              {statusConfig.text}
            </Badge>
          )}
        </div>

        {/* Progress Bar (if workflowTasks provided) */}
        {workflowTasks && workflowTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completedTasks} of {totalTasks} complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Collapsible Task List (if workflowTasks provided) */}
        {workflowTasks && workflowTasks.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span>{isExpanded ? 'Hide' : 'Show'} all tasks</span>
            </button>

            {isExpanded && (
              <div className="space-y-1 pl-2 border-l-2 border-border ml-2">
                {workflowTasks.map((workflowTask) => {
                  const isCurrentTask = workflowTask.id === task.id;
                  const StatusIcon = getStatusIcon(workflowTask.status);
                  const statusColor = getStatusColor(workflowTask.status);

                  return (
                    <div
                      key={workflowTask.id}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded ${
                        isCurrentTask ? 'bg-primary/10' : ''
                      }`}
                    >
                      <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
                      {isCurrentTask ? (
                        <span className="text-sm font-medium truncate">
                          {workflowTask.title}
                        </span>
                      ) : (
                        <Link
                          href={`/dashboard/action-center/tasks/${workflowTask.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground truncate"
                        >
                          {workflowTask.title}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Note when no task list is provided */}
        {(!workflowTasks || workflowTasks.length === 0) && (
          <p className="text-sm text-muted-foreground">
            View the full workflow for detailed progress and all related tasks.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Get the appropriate icon for a task status
 */
function getStatusIcon(status: string) {
  switch (status) {
    case 'done':
    case 'dismissed':
      return CheckCircle;
    case 'in_progress':
    case 'waiting':
      return Clock;
    default:
      return Circle;
  }
}

/**
 * Get the appropriate color class for a task status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'done':
      return 'text-emerald-500';
    case 'dismissed':
      return 'text-muted-foreground';
    case 'in_progress':
      return 'text-amber-500';
    case 'waiting':
      return 'text-amber-400';
    default:
      return 'text-muted-foreground';
  }
}

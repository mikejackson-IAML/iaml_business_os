'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Building2, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { WorkflowProgress } from '../../components/workflow-progress';
import type { WorkflowDetail, WorkflowStatus } from '@/lib/api/workflow-types';

interface WorkflowDetailContentProps {
  workflow: WorkflowDetail;
}

// Status badge configuration
const workflowStatusConfig: Record<
  WorkflowStatus,
  { text: string; variant: 'healthy' | 'warning' | 'info' | 'secondary' | 'critical' }
> = {
  not_started: { text: 'Not Started', variant: 'secondary' },
  in_progress: { text: 'In Progress', variant: 'info' },
  blocked: { text: 'Blocked', variant: 'warning' },
  completed: { text: 'Completed', variant: 'healthy' },
};

// Task status badge configuration
const taskStatusConfig: Record<
  string,
  { text: string; variant: 'outline' | 'secondary' | 'info' | 'warning' | 'healthy' }
> = {
  open: { text: 'Open', variant: 'outline' },
  in_progress: { text: 'In Progress', variant: 'info' },
  waiting: { text: 'Waiting', variant: 'warning' },
  done: { text: 'Done', variant: 'healthy' },
  dismissed: { text: 'Dismissed', variant: 'secondary' },
};

/**
 * WorkflowDetailContent - Full workflow detail view with header and task section
 *
 * Displays:
 * - Back link to workflows list
 * - Workflow name as h1 with status badge
 * - Progress ring with completion stats
 * - Description (if exists)
 * - Metadata row: target date, department, timestamps
 * - Task count breakdown badges
 * - Placeholder for task list (07-07)
 */
export function WorkflowDetailContent({ workflow }: WorkflowDetailContentProps) {
  const statusConfig = workflowStatusConfig[workflow.status] || workflowStatusConfig.not_started;

  // Task count by status (with defaults for missing keys)
  const taskCounts = {
    open: workflow.task_count_by_status?.open ?? 0,
    in_progress: workflow.task_count_by_status?.in_progress ?? 0,
    waiting: workflow.task_count_by_status?.waiting ?? 0,
    done: workflow.task_count_by_status?.done ?? 0,
    dismissed: workflow.task_count_by_status?.dismissed ?? 0,
  };

  // Format date helper
  const formatDate = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), 'MMM d, yyyy');
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/action-center/workflows"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Workflows
      </Link>

      {/* Header section */}
      <header className="space-y-4">
        {/* Title row with status badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-muted-foreground">{workflow.description}</p>
            )}
          </div>
          <Badge variant={statusConfig.variant} className="flex-shrink-0">
            {statusConfig.text}
          </Badge>
        </div>

        {/* Progress indicator */}
        <WorkflowProgress
          completed={workflow.completed_tasks}
          total={workflow.total_tasks}
          size="md"
        />

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {/* Target date */}
          {workflow.target_completion_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Target: {formatDate(workflow.target_completion_date)}</span>
            </div>
          )}

          {/* Department */}
          {workflow.department && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>{workflow.department}</span>
            </div>
          )}

          {/* Started at */}
          {workflow.started_at && (
            <div className="flex items-center gap-1.5">
              <PlayCircle className="h-4 w-4" />
              <span>Started: {formatDateTime(workflow.started_at)}</span>
            </div>
          )}

          {/* Completed at */}
          {workflow.completed_at && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Completed: {formatDateTime(workflow.completed_at)}</span>
            </div>
          )}

          {/* Created at (fallback if no started_at) */}
          {!workflow.started_at && !workflow.completed_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Created: {formatDateTime(workflow.created_at)}</span>
            </div>
          )}
        </div>

        {/* Task count breakdown badges */}
        <div className="flex flex-wrap items-center gap-2">
          {taskCounts.open > 0 && (
            <Badge variant={taskStatusConfig.open.variant} className="text-xs">
              Open: {taskCounts.open}
            </Badge>
          )}
          {taskCounts.in_progress > 0 && (
            <Badge variant={taskStatusConfig.in_progress.variant} className="text-xs">
              In Progress: {taskCounts.in_progress}
            </Badge>
          )}
          {taskCounts.waiting > 0 && (
            <Badge variant={taskStatusConfig.waiting.variant} className="text-xs">
              Waiting: {taskCounts.waiting}
            </Badge>
          )}
          {taskCounts.done > 0 && (
            <Badge variant={taskStatusConfig.done.variant} className="text-xs">
              Done: {taskCounts.done}
            </Badge>
          )}
          {taskCounts.dismissed > 0 && (
            <Badge variant={taskStatusConfig.dismissed.variant} className="text-xs">
              Dismissed: {taskCounts.dismissed}
            </Badge>
          )}
          {/* Show message if no tasks at all */}
          {workflow.total_tasks === 0 && (
            <span className="text-xs text-muted-foreground">No tasks yet</span>
          )}
        </div>
      </header>

      {/* Divider */}
      <hr className="border-border" />

      {/* Tasks section - placeholder for WorkflowTaskList (07-07) */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Tasks</h2>
        {/* TODO: Replace with WorkflowTaskList component in 07-07 */}
        <div className="border rounded-lg divide-y">
          {workflow.tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No tasks in this workflow yet.</p>
              <p className="text-sm mt-1">Tasks will appear here once added to the workflow.</p>
            </div>
          ) : (
            /* Temporary task list - will be replaced by WorkflowTaskList in 07-07 */
            workflow.tasks.map((task) => {
              const taskStatus = taskStatusConfig[task.status] || taskStatusConfig.open;
              return (
                <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      task.status === 'done'
                        ? 'bg-emerald-500'
                        : task.status === 'in_progress'
                        ? 'bg-blue-500'
                        : task.status === 'waiting'
                        ? 'bg-amber-500'
                        : task.status === 'dismissed'
                        ? 'bg-gray-400'
                        : 'bg-gray-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/action-center/tasks/${task.id}`}
                      className="font-medium hover:underline truncate block"
                    >
                      {task.title}
                    </Link>
                  </div>
                  <Badge variant={taskStatus.variant} className="text-xs flex-shrink-0">
                    {taskStatus.text}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

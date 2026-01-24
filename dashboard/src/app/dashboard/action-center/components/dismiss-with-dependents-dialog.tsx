'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/lib/utils';
import { dismissTaskAction, createTaskAction, getTaskDependenciesAction } from '../actions';
import type { TaskExtended } from '@/lib/api/task-types';

const dismissReasons = [
  { value: 'no_longer_relevant', label: 'No Longer Relevant' },
  { value: 'duplicate', label: 'Duplicate Task' },
  { value: 'will_not_do', label: 'Will Not Do' },
  { value: 'other', label: 'Other' },
] as const;

interface DismissWithDependentsDialogProps {
  taskId: string;
  taskTitle: string;
  blockingCount: number;
  priority: string;
  department: string | null;
  workflowId: string | null;
  isOpen: boolean;
  onClose: () => void;
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
 * BlockingTaskItem - Renders a single blocking task row
 */
function BlockingTaskItem({ task }: { task: TaskExtended }) {
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
        target="_blank"
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
 * DismissWithDependentsDialog - Enhanced dismiss dialog for tasks with dependents
 *
 * Implements DEP-06: Dismissing task with dependents creates decision task option.
 * Shows affected tasks and options:
 * - "Dismiss and unblock dependents" - dependents naturally unblock
 * - "Dismiss and create decision task" - creates task to handle what to do with dependents
 */
export function DismissWithDependentsDialog({
  taskId,
  taskTitle,
  blockingCount,
  priority,
  department,
  workflowId,
  isOpen,
  onClose,
}: DismissWithDependentsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Dismiss option: 'unblock' or 'decision'
  const [dismissOption, setDismissOption] = useState<'unblock' | 'decision'>('decision');

  // State for blocking tasks list
  const [blockingTasks, setBlockingTasks] = useState<TaskExtended[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showBlockingList, setShowBlockingList] = useState(false);

  // Fetch blocking tasks when dialog opens
  const fetchBlockingTasks = useCallback(async () => {
    if (blockingCount === 0) return;

    setIsLoadingTasks(true);
    try {
      const result = await getTaskDependenciesAction(taskId);
      if (result.success && result.data) {
        setBlockingTasks((result.data.blocking || []) as TaskExtended[]);
      }
    } catch (err) {
      console.error('Error fetching blocking tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [taskId, blockingCount]);

  // Fetch when dialog opens
  useEffect(() => {
    if (isOpen && blockingCount > 0) {
      fetchBlockingTasks();
    }
  }, [isOpen, blockingCount, fetchBlockingTasks]);

  const handleDismiss = () => {
    // Validate reason is selected
    if (!reason) {
      setError('Please select a reason for dismissing this task');
      return;
    }

    setError(null);
    startTransition(async () => {
      // First, dismiss the task
      const dismissResult = await dismissTaskAction(
        taskId,
        reason,
        notes.trim().length > 0 ? notes.trim() : null
      );

      if (!dismissResult.success) {
        setError(dismissResult.error || 'Failed to dismiss task');
        return;
      }

      // If option is 'decision', create a decision task
      if (dismissOption === 'decision') {
        // Build list of affected task titles for the description
        const affectedTasksList = blockingTasks.length > 0
          ? blockingTasks.map(t => `- ${t.title}`).join('\n')
          : `(${blockingCount} task${blockingCount !== 1 ? 's' : ''})`;

        const createResult = await createTaskAction({
          title: `Handle dismissed dependency: ${taskTitle}`,
          description: `The task "${taskTitle}" was dismissed (reason: ${reason}).${notes ? ` Notes: ${notes}` : ''}\n\nReview and decide what to do with the following dependent tasks:\n${affectedTasksList}`,
          task_type: 'decision',
          priority: priority as 'critical' | 'high' | 'normal' | 'low',
          department: department || undefined,
          workflow_id: workflowId || undefined,
          parent_task_id: taskId,
          source: 'workflow',
        });

        if (!createResult.success) {
          // Task was dismissed but decision task creation failed
          // Still close the dialog but show warning
          console.error('Failed to create decision task:', createResult.error);
          setError('Task dismissed, but failed to create decision task');
          // Still close after a delay to show the error
          setTimeout(() => {
            setReason('');
            setNotes('');
            setDismissOption('decision');
            onClose();
          }, 2000);
          return;
        }
      }

      // Success - reset and close
      setReason('');
      setNotes('');
      setDismissOption('decision');
      onClose();
    });
  };

  const handleClose = () => {
    setReason('');
    setNotes('');
    setError(null);
    setDismissOption('decision');
    setShowBlockingList(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 bg-background max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle>Dismiss Task with Dependents</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Task Title */}
            <div>
              <p className="text-sm text-muted-foreground">Task</p>
              <p className="font-medium">{taskTitle}</p>
            </div>

            {/* Warning Section */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    This task is blocking {blockingCount} other task{blockingCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    Dismissing this task will affect the dependent tasks below.
                  </p>
                </div>
              </div>

              {/* Collapsible affected tasks list */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowBlockingList(!showBlockingList)}
                  className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-300 hover:underline"
                >
                  {showBlockingList ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {showBlockingList ? 'Hide' : 'Show'} affected tasks
                </button>

                {showBlockingList && (
                  <div className="mt-2 bg-background rounded-md border border-border">
                    {isLoadingTasks ? (
                      <p className="text-sm text-muted-foreground p-3">Loading tasks...</p>
                    ) : blockingTasks.length > 0 ? (
                      <ul className="divide-y divide-border">
                        {blockingTasks.map((task) => (
                          <BlockingTaskItem key={task.id} task={task} />
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground p-3">
                        {blockingCount} dependent task{blockingCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Option Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium">How should the dependents be handled?</p>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="dismissOption"
                  value="unblock"
                  checked={dismissOption === 'unblock'}
                  onChange={() => setDismissOption('unblock')}
                  disabled={isPending}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm">Dismiss and unblock dependents</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dependent tasks will no longer be blocked and can proceed normally.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="dismissOption"
                  value="decision"
                  checked={dismissOption === 'decision'}
                  onChange={() => setDismissOption('decision')}
                  disabled={isPending}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-sm">Dismiss and create decision task</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Creates a new decision task to review and handle the dependent tasks.
                  </p>
                </div>
              </label>
            </div>

            {/* Reason Selection (Required) */}
            <div>
              <label
                htmlFor="dismiss-reason"
                className="text-sm font-medium mb-2 block"
              >
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                id="dismiss-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select a reason...</option>
                {dismissReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Notes (Optional) */}
            <div>
              <label
                htmlFor="dismiss-notes"
                className="text-sm font-medium mb-2 block"
              >
                Additional Notes (optional)
              </label>
              <textarea
                id="dismiss-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional context..."
                rows={3}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDismiss}
                disabled={isPending}
              >
                {isPending ? 'Dismissing...' : 'Dismiss Task'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

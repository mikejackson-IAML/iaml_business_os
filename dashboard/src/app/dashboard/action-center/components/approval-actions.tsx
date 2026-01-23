'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp, ThumbsDown, Edit2, X, Lightbulb } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import type { TaskExtended } from '@/lib/api/task-types';
import { approveTaskAction } from '../actions';

// ==================== RecommendationCallout ====================

interface RecommendationCalloutProps {
  task: TaskExtended;
}

/**
 * Displays the AI/system recommendation for approval tasks.
 * Shows recommendation and optional reasoning in a callout card.
 */
export function RecommendationCallout({ task }: RecommendationCalloutProps) {
  // Only show for approval tasks with recommendations
  if (task.task_type !== 'approval' || !task.recommendation) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/10">
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <span className="text-amber-700 dark:text-amber-400">Recommendation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 px-4 pb-4">
        <p className="text-foreground">{task.recommendation}</p>
        {task.recommendation_reasoning && (
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Reasoning:</span> {task.recommendation_reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== ModifyApproveDialog ====================

interface ModifyApproveDialogProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal dialog for approving a task with modifications.
 * Requires the user to enter modification details before approving.
 */
function ModifyApproveDialog({ taskId, isOpen, onClose }: ModifyApproveDialogProps) {
  const [modifications, setModifications] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    // Validate modifications not empty
    if (!modifications.trim()) {
      setError('Please describe the modifications required');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await approveTaskAction(taskId, 'modified', modifications.trim());
      if (result.success) {
        setModifications('');
        onClose();
      } else {
        setError(result.error || 'Failed to approve with modifications');
      }
    });
  };

  const handleClose = () => {
    setModifications('');
    setError(null);
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
      <Card className="relative w-full max-w-md mx-4 bg-background">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-amber-500" />
            <CardTitle>Modify & Approve</CardTitle>
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
            {/* Instructions */}
            <p className="text-sm text-muted-foreground">
              Describe the modifications required before this can be approved.
            </p>

            {/* Modifications Input */}
            <div>
              <label
                htmlFor="modifications"
                className="text-sm font-medium mb-2 block"
              >
                Required Modifications
              </label>
              <textarea
                id="modifications"
                value={modifications}
                onChange={(e) => setModifications(e.target.value)}
                placeholder="Describe what needs to be changed..."
                rows={4}
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
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Approving...' : 'Approve with Modifications'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== ApprovalActions ====================

interface ApprovalActionsProps {
  task: TaskExtended;
}

/**
 * Renders approval action buttons for approval-type tasks.
 * Shows Approve, Modify & Approve, and Reject buttons.
 * If a decision has already been made, shows the outcome instead.
 */
export function ApprovalActions({ task }: ApprovalActionsProps) {
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // If not an approval task, don't render
  if (task.task_type !== 'approval') {
    return null;
  }

  // If already decided, show outcome badge
  if (task.approval_outcome) {
    const outcomeConfig = {
      approved: {
        label: 'Approved',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        icon: ThumbsUp,
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: ThumbsDown,
      },
      modified: {
        label: 'Approved with Modifications',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        icon: Edit2,
      },
    };

    const config = outcomeConfig[task.approval_outcome];
    const Icon = config.icon;

    return (
      <div className="space-y-2">
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${config.className}`}>
          <Icon className="h-4 w-4" />
          <span className="font-medium">{config.label}</span>
        </div>
        {task.approval_modifications && (
          <div className="text-sm text-muted-foreground pl-1">
            <span className="font-medium">Modifications:</span> {task.approval_modifications}
          </div>
        )}
      </div>
    );
  }

  // Handle approve action
  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveTaskAction(task.id, 'approved', null);
      if (!result.success) {
        setError(result.error || 'Failed to approve');
      }
    });
  };

  // Handle reject action
  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveTaskAction(task.id, 'rejected', null);
      if (!result.success) {
        setError(result.error || 'Failed to reject');
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleApprove}
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          {isPending ? 'Processing...' : 'Approve'}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowModifyDialog(true)}
          disabled={isPending}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Modify & Approve
        </Button>

        <Button
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <ThumbsDown className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Modify Dialog */}
      <ModifyApproveDialog
        taskId={task.id}
        isOpen={showModifyDialog}
        onClose={() => setShowModifyDialog(false)}
      />
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { acceptSuggestionAction, rejectSuggestionAction } from '../actions';
import { RejectSuggestionDialog } from './reject-suggestion-dialog';
import type { TaskExtended } from '@/lib/api/task-types';

interface AISuggestionActionsProps {
  task: TaskExtended;
  variant?: 'inline' | 'full';  // inline for list, full for detail
}

export function AISuggestionActions({ task, variant = 'full' }: AISuggestionActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Only show for AI suggestions that are still open
  if (task.source !== 'ai' || task.status !== 'open') {
    return null;
  }

  const handleAccept = () => {
    startTransition(async () => {
      await acceptSuggestionAction(task.id);
    });
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAccept();
          }}
          disabled={isPending}
          className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowRejectDialog(true);
          }}
          disabled={isPending}
          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
        <RejectSuggestionDialog
          taskId={task.id}
          taskTitle={task.title}
          isOpen={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
        />
      </div>
    );
  }

  // Full variant for detail page
  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handleAccept}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        <Check className="h-4 w-4 mr-1" />
        Accept Suggestion
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowRejectDialog(true)}
        disabled={isPending}
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
      <RejectSuggestionDialog
        taskId={task.id}
        taskTitle={task.title}
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
      />
    </>
  );
}

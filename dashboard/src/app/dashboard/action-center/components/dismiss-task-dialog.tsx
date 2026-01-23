'use client';

import { useState, useTransition } from 'react';
import { X, XCircle } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { dismissTaskAction } from '../actions';

const dismissReasons = [
  { value: 'no_longer_relevant', label: 'No Longer Relevant' },
  { value: 'duplicate', label: 'Duplicate Task' },
  { value: 'will_not_do', label: 'Will Not Do' },
  { value: 'other', label: 'Other' },
] as const;

interface DismissTaskDialogProps {
  taskId: string;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DismissTaskDialog({
  taskId,
  taskTitle,
  isOpen,
  onClose,
}: DismissTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDismiss = () => {
    // Validate reason is selected
    if (!reason) {
      setError('Please select a reason for dismissing this task');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await dismissTaskAction(
        taskId,
        reason,
        notes.trim().length > 0 ? notes.trim() : null
      );
      if (result.success) {
        setReason('');
        setNotes('');
        onClose();
      } else {
        setError(result.error || 'Failed to dismiss task');
      }
    });
  };

  const handleClose = () => {
    setReason('');
    setNotes('');
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
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle>Dismiss Task</CardTitle>
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

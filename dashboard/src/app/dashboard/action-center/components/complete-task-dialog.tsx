'use client';

import { useState, useTransition } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { completeTaskAction } from '../actions';

interface CompleteTaskDialogProps {
  taskId: string;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CompleteTaskDialog({
  taskId,
  taskTitle,
  isOpen,
  onClose,
}: CompleteTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleComplete = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeTaskAction(
        taskId,
        note.trim().length > 0 ? note.trim() : null
      );
      if (result.success) {
        setNote('');
        onClose();
      } else {
        setError(result.error || 'Failed to complete task');
      }
    });
  };

  const handleClose = () => {
    setNote('');
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
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle>Complete Task</CardTitle>
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

            {/* Completion Note */}
            <div>
              <label
                htmlFor="completion-note"
                className="text-sm font-medium mb-2 block"
              >
                Completion Note (optional)
              </label>
              <textarea
                id="completion-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any notes about how this task was completed..."
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
              <Button onClick={handleComplete} disabled={isPending}>
                {isPending ? 'Completing...' : 'Complete Task'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

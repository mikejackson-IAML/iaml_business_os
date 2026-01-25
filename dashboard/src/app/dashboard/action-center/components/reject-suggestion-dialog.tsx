'use client';

import { useState, useTransition } from 'react';
import { X, XCircle } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { rejectSuggestionAction } from '../actions';

// Predefined rejection reasons for quick selection
const rejectionReasons = [
  { value: 'not_relevant', label: 'Not relevant to my work' },
  { value: 'already_done', label: 'Already done or in progress' },
  { value: 'not_priority', label: 'Not a priority right now' },
  { value: 'wrong_suggestion', label: 'Wrong suggestion type' },
  { value: 'other', label: 'Other reason' },
] as const;

interface RejectSuggestionDialogProps {
  taskId: string;
  taskTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RejectSuggestionDialog({
  taskId,
  taskTitle,
  isOpen,
  onClose,
}: RejectSuggestionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const handleReject = () => {
    // Reason is optional per CONTEXT.md, but we combine if provided
    const reason = selectedReason === 'other'
      ? customReason.trim() || 'Other'
      : selectedReason
        ? rejectionReasons.find(r => r.value === selectedReason)?.label || ''
        : undefined;

    startTransition(async () => {
      await rejectSuggestionAction(taskId, reason);
      setSelectedReason('');
      setCustomReason('');
      onClose();
    });
  };

  // "Skip" without reason option for minimal friction
  const handleSkipWithoutReason = () => {
    startTransition(async () => {
      await rejectSuggestionAction(taskId, undefined);
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <Card className="relative w-full max-w-md mx-4 bg-background">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Reject AI Suggestion</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>Suggestion:</strong> {taskTitle}
          </p>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Why reject? (optional - helps AI improve)
            </label>
            <div className="space-y-2">
              {rejectionReasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Tell us more..."
                rows={2}
                className="mt-2 w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
              />
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipWithoutReason}
              disabled={isPending}
            >
              Skip without reason
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending}
              >
                {isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

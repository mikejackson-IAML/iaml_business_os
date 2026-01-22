'use client';

import { useState, useTransition } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { overrideClaim } from '../actions';

interface OverrideClaimModalProps {
  claimId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OverrideClaimModal({ claimId, isOpen, onClose }: OverrideClaimModalProps) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleOverride = async () => {
    if (reason.trim().length < 3) {
      setError('Please provide a reason (minimum 3 characters)');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await overrideClaim(claimId, reason);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to override claim');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 bg-background">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Override Claim
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                This will remove the instructor's claim and re-open the block for claiming.
                The instructor will be notified of the cancellation.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason for Override <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter reason for overriding this claim..."
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleOverride}
                disabled={isPending}
              >
                {isPending ? 'Overriding...' : 'Override Claim'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

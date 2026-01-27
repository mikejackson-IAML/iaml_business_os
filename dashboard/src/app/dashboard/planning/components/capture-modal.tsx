'use client';

import { useState, useTransition, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { toast } from 'sonner';
import { createProjectAction } from '../actions';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CaptureModal({ isOpen, onClose }: CaptureModalProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setOneLiner('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createProjectAction(
        title.trim(),
        oneLiner.trim() || undefined
      );

      if (result.success) {
        toast.success('Idea captured!');
        resetForm();
        onClose();
      } else {
        toast.error(result.error || 'Failed to capture idea');
      }
    });
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 bg-background flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle>Capture Idea</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Quick-capture a new idea. You can flesh it out later.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Title (required) */}
            <div>
              <label
                htmlFor="capture-title"
                className="text-sm font-medium mb-2 block"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="capture-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="What's the idea?"
                autoFocus
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* One-liner (optional) */}
            <div>
              <label
                htmlFor="capture-one-liner"
                className="text-sm font-medium mb-2 block"
              >
                One-liner
              </label>
              <input
                id="capture-one-liner"
                type="text"
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                placeholder="One sentence summary (optional)"
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </form>
        </CardContent>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Capturing...' : 'Capture'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

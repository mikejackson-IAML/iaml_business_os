'use client';

import { useState } from 'react';
import { Search, Loader2, X, Check } from 'lucide-react';
import { Card } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { toast } from 'sonner';

interface ResearchSuggestionCardProps {
  query: string;
  projectId: string;
  conversationId: string;
  phaseId: string;
  onCompleted: (researchId: string) => void;
  onDismiss: () => void;
}

export function ResearchSuggestionCard({
  query,
  projectId,
  conversationId,
  phaseId,
  onCompleted,
  onDismiss,
}: ResearchSuggestionCardProps) {
  const [editableQuery, setEditableQuery] = useState(query);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleResearch = async () => {
    setStatus('loading');

    try {
      const res = await fetch('/api/planning/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          conversationId,
          phaseId,
          query: editableQuery,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Research failed' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setStatus('success');
      toast('Research complete');
      onCompleted(data.id || data.researchId || 'unknown');

      // Auto-dismiss after 2 seconds
      setTimeout(() => {
        onDismiss();
      }, 2000);
    } catch (err) {
      setStatus('error');
      toast.error(err instanceof Error ? err.message : 'Research failed');
    }
  };

  return (
    <Card className="mx-4 my-2 p-3 border-primary/20 bg-primary/5">
      <div className="flex items-start gap-3">
        <Search className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-2">
            {status === 'success' ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                Research complete
              </span>
            ) : (
              <>Research Suggestion</>
            )}
          </p>
          {status !== 'success' && (
            <textarea
              value={editableQuery}
              onChange={(e) => setEditableQuery(e.target.value)}
              disabled={status === 'loading'}
              rows={2}
              className="w-full text-sm p-2 rounded border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          )}
        </div>
        {status === 'idle' && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" onClick={handleResearch}>
              Research
            </Button>
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {status === 'loading' && (
          <Button size="sm" disabled>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            Researching...
          </Button>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={handleResearch}>
              Retry
            </Button>
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

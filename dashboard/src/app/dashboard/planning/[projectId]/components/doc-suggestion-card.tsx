'use client';

import { useState } from 'react';
import { FileText, Loader2, X, Check } from 'lucide-react';
import { Card } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { DOC_TYPE_LABELS } from '@/lib/planning/doc-templates';
import type { DocumentType } from '@/lib/planning/doc-templates';

interface DocSuggestionCardProps {
  docType: string;
  projectId: string;
  onGenerated: () => void;
  onDismiss: () => void;
}

export function DocSuggestionCard({
  docType,
  projectId,
  onGenerated,
  onDismiss,
}: DocSuggestionCardProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const label = DOC_TYPE_LABELS[docType as DocumentType] || docType;

  const handleGenerate = async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/planning/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, docType }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      setStatus('success');
      onGenerated();

      // Auto-dismiss after 2 seconds
      setTimeout(() => {
        onDismiss();
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <Card className="mx-4 my-2 p-3 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {status === 'success' ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                {label} generated
              </span>
            ) : (
              <>Ready to generate your {label}?</>
            )}
          </p>
          {status === 'error' && errorMessage && (
            <p className="text-xs text-destructive mt-1">{errorMessage}</p>
          )}
        </div>
        {status === 'idle' && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" onClick={handleGenerate}>
              Generate
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
            Generating...
          </Button>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={handleGenerate}>
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

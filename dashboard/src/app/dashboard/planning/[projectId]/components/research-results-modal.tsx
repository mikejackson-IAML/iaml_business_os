'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { PlanningResearch, ResearchStatus } from '@/dashboard-kit/types/departments/planning';

const STATUS_STYLES: Record<ResearchStatus, { className: string; label: string }> = {
  pending: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 animate-pulse', label: 'Pending' },
  running: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse', label: 'Running' },
  complete: { className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Complete' },
  failed: { className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Failed' },
};

interface ResearchResultsModalProps {
  research: PlanningResearch | null;
  open: boolean;
  onClose: () => void;
}

export function ResearchResultsModal({ research, open, onClose }: ResearchResultsModalProps) {
  if (!research) return null;

  const statusStyle = STATUS_STYLES[research.status];
  const citations = getCitations(research);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg pr-6">{research.query}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <Badge variant="secondary" className={`text-xs ${statusStyle.className}`}>
              {statusStyle.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(research.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {research.summary ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {research.summary}
              </ReactMarkdown>
            </div>
          ) : research.status === 'failed' ? (
            <p className="text-sm text-red-500">
              Research failed: {(research.raw_results as Record<string, string>)?.error || 'Unknown error'}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {research.status === 'pending' || research.status === 'running'
                ? 'Research is in progress...'
                : 'No results available.'}
            </p>
          )}

          {citations.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium mb-2">Citations</h4>
              <ol className="space-y-1 list-decimal list-inside">
                {citations.map((url, i) => (
                  <li key={i} className="text-xs">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      {truncateUrl(url)}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getCitations(research: PlanningResearch): string[] {
  if (!research.key_findings) return [];
  // key_findings is stored as { citations: string[], model: string }
  const findings = research.key_findings as unknown as { citations?: string[] };
  if (findings && Array.isArray(findings.citations)) {
    return findings.citations;
  }
  return [];
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.slice(0, 30) + '...' : u.pathname;
    return u.hostname + path;
  } catch {
    return url.length > 60 ? url.slice(0, 60) + '...' : url;
  }
}

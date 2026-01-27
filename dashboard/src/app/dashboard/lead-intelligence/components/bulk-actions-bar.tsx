'use client';

import { X, Send, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onAddToCampaign: () => void;
  onBulkEnrich: () => void;
  onBulkFollowUp: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onAddToCampaign,
  onBulkEnrich,
  onBulkFollowUp,
}: BulkActionsBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-3">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
        </span>

        <div className="h-4 w-px bg-primary-foreground/30" />

        <Button
          variant="secondary"
          size="sm"
          onClick={onAddToCampaign}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          Add to Campaign
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onBulkEnrich}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Enrich Selected
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onBulkFollowUp}
          className="gap-1.5"
        >
          <Clock className="h-3.5 w-3.5" />
          Set Follow-up
        </Button>

        <div className="h-4 w-px bg-primary-foreground/30" />

        <button
          onClick={onClear}
          className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

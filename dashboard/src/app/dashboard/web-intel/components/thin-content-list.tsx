'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { cn } from '@/lib/utils';
import type { ThinContentWithInventory } from '@/lib/api/web-intel-queries';

interface ThinContentListProps {
  pages: ThinContentWithInventory[];
}

export function ThinContentList({ pages }: ThinContentListProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = pages.length > 5;
  const displayPages = expanded ? pages : pages.slice(0, 5);

  if (pages.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        No thin content flags
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {displayPages.map((page) => (
        <div
          key={page.id}
          className="flex items-center justify-between py-2 px-3 rounded bg-muted/50 hover:bg-muted/70"
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-sm truncate" title={page.url}>
              {page.url}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              {page.wordCount ?? 0} words
            </span>
            <span
              className={cn(
                'flex items-center gap-1',
                (page.bounceRate ?? 0) > 70 ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {page.bounceRate?.toFixed(0)}% bounce
            </span>
          </div>
        </div>
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              View all ({pages.length})
            </>
          )}
        </Button>
      )}
    </div>
  );
}

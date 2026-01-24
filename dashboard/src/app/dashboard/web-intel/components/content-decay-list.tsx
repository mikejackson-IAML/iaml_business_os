'use client';

import { useState } from 'react';
import { TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContentDecayWithInventory } from '@/lib/api/web-intel-queries';

interface ContentDecayListProps {
  pages: ContentDecayWithInventory[];
}

function getSeverityVariant(
  severity: 'minor' | 'moderate' | 'severe' | null
): 'destructive' | 'secondary' | 'outline' {
  switch (severity) {
    case 'severe':
      return 'destructive';
    case 'moderate':
      return 'secondary';
    case 'minor':
    default:
      return 'outline';
  }
}

export function ContentDecayList({ pages }: ContentDecayListProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = pages.length > 5;
  const displayPages = expanded ? pages : pages.slice(0, 5);

  if (pages.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-4">
        No content decay detected
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
            {page.title && (
              <p className="text-xs text-muted-foreground truncate">{page.title}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={cn('flex items-center gap-1 text-sm font-medium', 'text-destructive')}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              {page.decayPercentage?.toFixed(0)}%
            </span>
            <Badge variant={getSeverityVariant(page.severity)}>{page.severity ?? 'unknown'}</Badge>
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

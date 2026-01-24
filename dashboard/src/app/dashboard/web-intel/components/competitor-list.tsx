'use client';

import { Globe } from 'lucide-react';
import type { Competitor } from '@/lib/api/web-intel-queries';

interface CompetitorListProps {
  competitors: Competitor[];
}

export function CompetitorList({ competitors }: CompetitorListProps) {
  if (competitors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No competitors tracked
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {competitors.map((competitor) => (
        <div
          key={competitor.id}
          className="flex items-center justify-between py-2 px-3 rounded bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{competitor.domain}</p>
              {competitor.name && (
                <p className="text-xs text-muted-foreground">{competitor.name}</p>
              )}
            </div>
          </div>
          {competitor.notes && (
            <span
              className="text-xs text-muted-foreground max-w-[200px] truncate"
              title={competitor.notes}
            >
              {competitor.notes}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

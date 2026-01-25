'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { cn } from '@/dashboard-kit/lib/utils';
import type { SharedKeyword } from '@/lib/api/web-intel-queries';

interface SharedKeywordsTableProps {
  keywords: SharedKeyword[];
  initialCount?: number;
}

/**
 * Position cell with win/loss coloring
 * Green when our position beats competitor, red when we're behind
 */
function CompetitorPositionCell({
  ourPosition,
  competitorPosition,
}: {
  ourPosition: number | null;
  competitorPosition: number;
}) {
  if (ourPosition === null) {
    return <span className="text-muted-foreground">{competitorPosition}</span>;
  }

  const isWinning = ourPosition < competitorPosition;
  const isLosing = ourPosition > competitorPosition;
  const isTied = ourPosition === competitorPosition;

  return (
    <span
      className={cn(
        'font-medium px-1.5 py-0.5 rounded text-xs',
        isWinning && 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
        isLosing && 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
        isTied && 'text-muted-foreground'
      )}
    >
      {competitorPosition}
    </span>
  );
}

export function SharedKeywordsTable({
  keywords,
  initialCount = 5,
}: SharedKeywordsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const displayKeywords = expanded ? keywords : keywords.slice(0, initialCount);
  const hasMore = keywords.length > initialCount;

  if (keywords.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No shared keyword data available
      </p>
    );
  }

  // Get unique competitor domains from all keywords
  const competitorDomains = Array.from(
    new Set(
      keywords.flatMap((k) =>
        k.competitorPositions.map((cp) => cp.domain)
      )
    )
  ).slice(0, 3); // Limit to 3 competitors for table width

  return (
    <div className="space-y-2">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
                Keyword
              </th>
              <th className="text-center py-2 px-2 font-medium text-muted-foreground">
                Us
              </th>
              {competitorDomains.map((domain) => (
                <th
                  key={domain}
                  className="text-center py-2 px-2 font-medium text-muted-foreground"
                  title={domain}
                >
                  {/* Truncate long domains */}
                  {domain.length > 12 ? `${domain.slice(0, 10)}...` : domain}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayKeywords.map((kw) => {
              // Build position map for this keyword
              const positionMap = new Map(
                kw.competitorPositions.map((cp) => [cp.domain, cp.position])
              );

              return (
                <tr key={kw.keywordId} className="border-b border-muted/50">
                  <td className="py-2 pr-4">
                    <span className="font-medium">{kw.keyword}</span>
                  </td>
                  <td className="text-center py-2 px-2">
                    {kw.ourPosition !== null ? (
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                        {kw.ourPosition}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  {competitorDomains.map((domain) => {
                    const pos = positionMap.get(domain);
                    return (
                      <td key={domain} className="text-center py-2 px-2">
                        {pos !== undefined ? (
                          <CompetitorPositionCell
                            ourPosition={kw.ourPosition}
                            competitorPosition={pos}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expand/collapse button */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
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
              View all ({keywords.length})
            </>
          )}
        </Button>
      )}
    </div>
  );
}

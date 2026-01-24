'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { TrackedKeyword, DailyRanking } from '@/lib/api/web-intel-queries';
import { KeywordPriorityFilter } from './priority-filter';
import { SortableHeader } from './sortable-header';
import { KeywordRow } from './keyword-row';

interface KeywordsTableProps {
  keywords: TrackedKeyword[];
  rankings: DailyRanking[];
  priorityFilter: KeywordPriorityFilter;
  className?: string;
}

type SortKey = 'priority' | 'keyword' | 'position' | 'change';
type SortDir = 'asc' | 'desc';

// Priority sort order (critical = 0 is highest priority)
const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface KeywordWithRanking {
  keyword: TrackedKeyword;
  currentPosition: number | null;
  change: number | null;
}

/**
 * Main keywords ranking table with sorting and filtering.
 * Displays keyword, position, change, priority, and URL columns.
 * Rows expand to show sparkline and SERP features.
 */
export function KeywordsTable({
  keywords,
  rankings,
  priorityFilter,
  className,
}: KeywordsTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc'); // asc for priority means critical first
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group rankings by keywordId for quick lookup
  const rankingsByKeyword = useMemo(() => {
    const grouped = new Map<string, DailyRanking[]>();
    for (const r of rankings) {
      const existing = grouped.get(r.keywordId) || [];
      existing.push(r);
      grouped.set(r.keywordId, existing);
    }
    // Sort each group by date descending (most recent first)
    for (const [, list] of grouped) {
      list.sort((a, b) => new Date(b.collectedDate).getTime() - new Date(a.collectedDate).getTime());
    }
    return grouped;
  }, [rankings]);

  // Join keywords with their most recent rankings and calculate changes
  const keywordsWithRankings = useMemo(() => {
    return keywords.map((kw): KeywordWithRanking => {
      const keywordRankings = rankingsByKeyword.get(kw.id) || [];
      const mostRecent = keywordRankings[0];
      const previous = keywordRankings[1];

      // Calculate change from last 2 rankings
      let change: number | null = null;
      if (mostRecent?.position !== null && previous?.position !== null) {
        // Change = new - old (positive = dropped, negative = improved)
        change = mostRecent.position - previous.position;
      }

      return {
        keyword: kw,
        currentPosition: mostRecent?.position ?? null,
        change,
      };
    });
  }, [keywords, rankingsByKeyword]);

  // Filter by priority
  const filteredKeywords = useMemo(() => {
    if (priorityFilter === 'all') {
      return keywordsWithRankings;
    }
    return keywordsWithRankings.filter((kw) => kw.keyword.priority === priorityFilter);
  }, [keywordsWithRankings, priorityFilter]);

  // Sort keywords
  const sortedKeywords = useMemo(() => {
    const sorted = [...filteredKeywords];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'keyword':
          comparison = a.keyword.keyword.localeCompare(b.keyword.keyword);
          break;
        case 'position':
          // Null positions sort to bottom (use 101 as max)
          const posA = a.currentPosition ?? 101;
          const posB = b.currentPosition ?? 101;
          comparison = posA - posB;
          break;
        case 'change':
          // Null changes sort to bottom
          const changeA = a.change ?? (sortDir === 'desc' ? -Infinity : Infinity);
          const changeB = b.change ?? (sortDir === 'desc' ? -Infinity : Infinity);
          comparison = changeA - changeB;
          break;
        case 'priority':
        default:
          comparison = priorityOrder[a.keyword.priority] - priorityOrder[b.keyword.priority];
          break;
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredKeywords, sortBy, sortDir]);

  // Handle column sort click
  const handleSort = (key: string) => {
    const newKey = key as SortKey;
    if (sortBy === newKey) {
      // Toggle direction
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // Switch to new column with sensible default
      setSortBy(newKey);
      switch (newKey) {
        case 'position':
          setSortDir('asc'); // Best position (1) first
          break;
        case 'change':
          setSortDir('asc'); // Biggest improvements first (negative numbers)
          break;
        case 'keyword':
          setSortDir('asc'); // Alphabetical
          break;
        case 'priority':
        default:
          setSortDir('asc'); // Critical first (lowest priority order value)
          break;
      }
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_80px_100px_200px] gap-4 px-6 py-3 border-b border-border bg-muted/30">
          <SortableHeader
            label="Keyword"
            sortKey="keyword"
            currentSort={sortBy}
            currentDir={sortDir}
            onSort={handleSort}
          />
          <SortableHeader
            label="Position"
            sortKey="position"
            currentSort={sortBy}
            currentDir={sortDir}
            onSort={handleSort}
          />
          <SortableHeader
            label="Change"
            sortKey="change"
            currentSort={sortBy}
            currentDir={sortDir}
            onSort={handleSort}
          />
          <SortableHeader
            label="Priority"
            sortKey="priority"
            currentSort={sortBy}
            currentDir={sortDir}
            onSort={handleSort}
          />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            URL
          </span>
        </div>

        {/* Data rows */}
        {sortedKeywords.map((item) => {
          const kwRankings = rankingsByKeyword.get(item.keyword.id) || [];
          const rankingHistory = kwRankings.slice(0, 7).map((r) => ({
            date: r.collectedDate.toISOString().split('T')[0],
            position: r.position,
          }));
          const latestRanking = kwRankings[0] ?? null;

          return (
            <KeywordRow
              key={item.keyword.id}
              keyword={item.keyword}
              currentPosition={item.currentPosition}
              positionChange={item.change}
              rankingHistory={rankingHistory}
              latestRanking={latestRanking}
              isExpanded={expandedId === item.keyword.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === item.keyword.id ? null : item.keyword.id)
              }
            />
          );
        })}

        {/* Empty state */}
        {sortedKeywords.length === 0 && (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No keywords match the current filter.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

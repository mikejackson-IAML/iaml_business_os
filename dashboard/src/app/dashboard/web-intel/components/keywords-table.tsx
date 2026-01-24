'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { TrackedKeyword, DailyRanking } from '@/lib/api/web-intel-queries';
import { KeywordPriorityFilter } from './priority-filter';
import { PositionChange } from './position-change';
import { SortableHeader } from './sortable-header';

interface KeywordsTableProps {
  keywords: TrackedKeyword[];
  rankings: DailyRanking[];
  priorityFilter: KeywordPriorityFilter;
  className?: string;
}

type SortKey = 'priority' | 'keyword' | 'position' | 'change';
type SortDir = 'asc' | 'desc';

// Priority display config matching action-center/task-row.tsx pattern
const priorityConfig = {
  critical: { color: 'bg-red-500', text: 'Critical' },
  high: { color: 'bg-orange-500', text: 'High' },
  medium: { color: 'bg-yellow-500', text: 'Medium' },
  low: { color: 'bg-blue-500', text: 'Low' },
};

// Priority sort order (critical = 0 is highest priority)
const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface KeywordWithRanking {
  id: string;
  keyword: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  targetUrl: string | null;
  currentPosition: number | null;
  change: number | null;
}

/**
 * Main keywords ranking table with sorting and filtering.
 * Displays keyword, position, change, priority, and URL columns.
 */
export function KeywordsTable({
  keywords,
  rankings,
  priorityFilter,
  className,
}: KeywordsTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc'); // asc for priority means critical first

  // Join keywords with their most recent rankings and calculate changes
  const keywordsWithRankings = useMemo(() => {
    // Group rankings by keywordId, sorted by date (most recent first)
    const rankingsByKeyword = new Map<string, DailyRanking[]>();
    for (const ranking of rankings) {
      const existing = rankingsByKeyword.get(ranking.keywordId) || [];
      existing.push(ranking);
      rankingsByKeyword.set(ranking.keywordId, existing);
    }

    // Sort each keyword's rankings by date (most recent first)
    rankingsByKeyword.forEach((keywordRankings, keywordId) => {
      keywordRankings.sort((a, b) =>
        new Date(b.collectedDate).getTime() - new Date(a.collectedDate).getTime()
      );
    });

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
        id: kw.id,
        keyword: kw.keyword,
        priority: kw.priority,
        targetUrl: kw.targetUrl,
        currentPosition: mostRecent?.position ?? null,
        change,
      };
    });
  }, [keywords, rankings]);

  // Filter by priority
  const filteredKeywords = useMemo(() => {
    if (priorityFilter === 'all') {
      return keywordsWithRankings;
    }
    return keywordsWithRankings.filter((kw) => kw.priority === priorityFilter);
  }, [keywordsWithRankings, priorityFilter]);

  // Sort keywords
  const sortedKeywords = useMemo(() => {
    const sorted = [...filteredKeywords];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'keyword':
          comparison = a.keyword.localeCompare(b.keyword);
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
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
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
        {sortedKeywords.map((kw) => (
          <div
            key={kw.id}
            className="grid grid-cols-[1fr_80px_80px_100px_200px] gap-4 px-6 py-3 border-b border-border last:border-0 hover:bg-muted/50 items-center"
          >
            <span className="font-medium truncate">{kw.keyword}</span>
            <span className="text-sm">
              {kw.currentPosition !== null ? kw.currentPosition : '—'}
            </span>
            <PositionChange change={kw.change} />
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${priorityConfig[kw.priority].color}`}
              />
              <span className="text-sm">{priorityConfig[kw.priority].text}</span>
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {kw.targetUrl ?? '—'}
            </span>
          </div>
        ))}

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

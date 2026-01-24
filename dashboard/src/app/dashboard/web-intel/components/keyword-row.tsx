'use client';

import { ChevronRight, ChevronDown } from 'lucide-react';
import { PositionChange } from './position-change';
import { KeywordRowExpanded } from './keyword-row-expanded';
import type { TrackedKeyword, DailyRanking } from '@/lib/api/web-intel-queries';

interface KeywordRowProps {
  keyword: TrackedKeyword;
  currentPosition: number | null;
  positionChange: number | null;
  rankingHistory: Array<{ date: string; position: number | null }>;
  latestRanking: DailyRanking | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const priorityConfig = {
  critical: { color: 'bg-red-500', text: 'Critical' },
  high: { color: 'bg-orange-500', text: 'High' },
  medium: { color: 'bg-yellow-500', text: 'Medium' },
  low: { color: 'bg-blue-500', text: 'Low' },
};

export function KeywordRow({
  keyword,
  currentPosition,
  positionChange,
  rankingHistory,
  latestRanking,
  isExpanded,
  onToggleExpand,
}: KeywordRowProps) {
  const priority = priorityConfig[keyword.priority];
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  const serpFeatures = latestRanking
    ? {
        hasFeaturedSnippet: latestRanking.hasFeaturedSnippet,
        hasPeopleAlsoAsk: latestRanking.hasPeopleAlsoAsk,
        hasLocalPack: latestRanking.hasLocalPack,
        hasVideoResults: latestRanking.hasVideoResults,
        hasImagePack: latestRanking.hasImagePack,
        hasKnowledgePanel: latestRanking.hasKnowledgePanel,
      }
    : {
        hasFeaturedSnippet: false,
        hasPeopleAlsoAsk: false,
        hasLocalPack: false,
        hasVideoResults: false,
        hasImagePack: false,
        hasKnowledgePanel: false,
      };

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggleExpand}
        className="w-full grid grid-cols-[1fr_80px_80px_100px_200px] gap-4 px-6 py-3 hover:bg-muted/50 transition-colors text-left items-center"
      >
        <div className="flex items-center gap-2">
          <ChevronIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{keyword.keyword}</span>
        </div>
        <span className="text-sm">{currentPosition ?? '\u2014'}</span>
        <PositionChange change={positionChange} />
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${priority.color}`} />
          <span className="text-sm">{priority.text}</span>
        </div>
        <span className="text-sm text-muted-foreground truncate">
          {keyword.targetUrl ?? '\u2014'}
        </span>
      </button>

      {isExpanded && (
        <KeywordRowExpanded
          rankingHistory={rankingHistory}
          serpFeatures={serpFeatures}
          rankingUrl={latestRanking?.rankingUrl ?? null}
        />
      )}
    </div>
  );
}

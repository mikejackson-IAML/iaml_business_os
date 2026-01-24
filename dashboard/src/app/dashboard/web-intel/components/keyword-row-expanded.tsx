'use client';

import { RankingSparkline } from './ranking-sparkline';
import { SerpFeatures } from './serp-features';

interface KeywordRowExpandedProps {
  rankingHistory: Array<{ date: string; position: number | null }>;
  serpFeatures: {
    hasFeaturedSnippet: boolean;
    hasPeopleAlsoAsk: boolean;
    hasLocalPack: boolean;
    hasVideoResults: boolean;
    hasImagePack: boolean;
    hasKnowledgePanel: boolean;
  };
  rankingUrl: string | null;
}

export function KeywordRowExpanded({
  rankingHistory,
  serpFeatures,
  rankingUrl,
}: KeywordRowExpandedProps) {
  const hasAnyFeature = Object.values(serpFeatures).some((v) => v);

  return (
    <div className="px-6 pl-12 py-4 bg-muted/30 border-b border-border">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            7-Day History
          </p>
          <RankingSparkline data={rankingHistory} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            SERP Features
          </p>
          {hasAnyFeature ? (
            <SerpFeatures {...serpFeatures} />
          ) : (
            <span className="text-sm text-muted-foreground">None</span>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Ranking URL
          </p>
          <span className="text-sm text-muted-foreground truncate block">
            {rankingUrl ?? '\u2014'}
          </span>
        </div>
      </div>
    </div>
  );
}

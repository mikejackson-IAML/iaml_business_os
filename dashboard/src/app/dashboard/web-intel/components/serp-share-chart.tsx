'use client';

import { BarList } from '@tremor/react';
import type { SerpShare } from '@/lib/api/web-intel-queries';

interface SerpShareChartProps {
  serpShare: SerpShare | null;
  ourDomain?: string;
}

export function SerpShareChart({ serpShare, ourDomain = 'Our Site' }: SerpShareChartProps) {
  if (!serpShare || serpShare.ourShare === null) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No SERP share data available
      </div>
    );
  }

  // Build data array: our site first, then competitors sorted by share
  const barData = [
    { name: ourDomain, value: serpShare.ourShare },
    ...Object.entries(serpShare.competitorShares)
      .map(([domain, share]) => ({ name: domain, value: share }))
      .sort((a, b) => b.value - a.value),
  ];

  return (
    <div className="space-y-4">
      {/* Header metric - our share prominently displayed */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Your Share of Voice</span>
        <div className="text-right">
          <span className="text-2xl font-semibold">{serpShare.ourShare.toFixed(1)}%</span>
        </div>
      </div>

      {/* Bar chart */}
      <BarList
        data={barData}
        valueFormatter={(v: number) => `${v.toFixed(1)}%`}
        color="cyan"
        className="mt-2"
      />

      {/* Keywords tracked info */}
      {serpShare.keywordsTracked !== null && (
        <p className="text-xs text-muted-foreground text-center">
          Based on {serpShare.keywordsTracked} tracked keywords
          {serpShare.keywordsRanking !== null && ` (${serpShare.keywordsRanking} ranking)`}
        </p>
      )}
    </div>
  );
}

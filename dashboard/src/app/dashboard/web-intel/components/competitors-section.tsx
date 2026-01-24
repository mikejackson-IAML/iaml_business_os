'use client';

import { Trophy, Users2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import type { Competitor, SerpShare } from '@/lib/api/web-intel-queries';
import { CompetitorList } from './competitor-list';
import { SerpShareChart } from './serp-share-chart';

interface CompetitorsSectionProps {
  competitors: Competitor[];
  serpShare: SerpShare | null;
}

export function CompetitorsSection({ competitors, serpShare }: CompetitorsSectionProps) {
  // Check if both are empty - show helpful message
  const isEmpty = competitors.length === 0 && !serpShare;

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Competitive Landscape
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Start tracking competitors to see your SERP share of voice</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Competitive Landscape
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SERP Share section */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-cyan-500" />
            SERP Share of Voice
          </h3>
          <SerpShareChart serpShare={serpShare} />
        </div>

        {/* Competitor list section */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Users2 className="h-4 w-4 text-muted-foreground" />
            Tracked Competitors
          </h3>
          <CompetitorList competitors={competitors} />
        </div>
      </CardContent>
    </Card>
  );
}

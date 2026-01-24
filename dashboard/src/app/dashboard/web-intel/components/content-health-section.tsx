'use client';

import { FileWarning, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { ContentDecayList } from './content-decay-list';
import { ThinContentList } from './thin-content-list';
import type {
  ContentSummary,
  ContentDecayWithInventory,
  ThinContentWithInventory,
} from '@/lib/api/web-intel-queries';

interface ContentHealthSectionProps {
  summary: ContentSummary;
  decayPages: ContentDecayWithInventory[];
  thinPages: ThinContentWithInventory[];
}

export function ContentHealthSection({
  summary,
  decayPages,
  thinPages,
}: ContentHealthSectionProps) {
  const isHealthy = decayPages.length === 0 && thinPages.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="h-5 w-5" />
          Content Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary metrics at top */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-semibold">{summary.totalIndexed.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Indexed Pages</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-semibold">{summary.avgWordCount.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Avg Word Count</div>
          </div>
        </div>

        {/* If content is healthy, show a positive message */}
        {isHealthy ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Content is healthy - no issues detected</span>
          </div>
        ) : (
          <>
            {/* Content Decay section */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Decaying Content
              </h3>
              <ContentDecayList pages={decayPages} />
            </div>

            {/* Thin Content section */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Thin Content
              </h3>
              <ThinContentList pages={thinPages} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

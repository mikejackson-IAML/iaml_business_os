'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/dashboard-kit/components/ui/card';
import type { SearchPerformance } from '@/lib/api/web-intel-queries';

interface TopQueriesListProps {
  searchPerformance: SearchPerformance[];
  limit?: number;
}

export function TopQueriesList({ searchPerformance, limit = 10 }: TopQueriesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Queries</CardTitle>
      </CardHeader>
      <CardContent>
        {searchPerformance.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No search query data available.
          </p>
        ) : (
          <div className="space-y-2">
            {searchPerformance.slice(0, limit).map((sp, i) => (
              <div key={sp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-6">{i + 1}.</span>
                  <span className="font-medium truncate max-w-[300px]">{sp.query || '(not set)'}</span>
                </div>
                <span className="text-muted-foreground">{sp.clicks.toLocaleString()} clicks</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

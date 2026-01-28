'use client';

import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header className="mb-8">
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-4 w-64" />
      </header>

      {/* Period Selector */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <CardContent className="p-0 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16" />
              </div>
              <Skeleton className="h-10 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mt-2">
            {[100, 85, 70, 55, 40].map((width, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 flex-1" style={{ maxWidth: `${width}%` }} />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

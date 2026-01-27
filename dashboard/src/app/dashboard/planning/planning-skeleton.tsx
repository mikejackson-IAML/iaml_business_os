'use client';

import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';

export function PlanningSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Column Headers */}
      <div className="grid grid-cols-5 gap-4">
        {['Incubating', 'Active', 'Ready to Build', 'Building', 'Shipped'].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-full" />
            {/* Cards per column */}
            {[...Array(i % 2 === 0 ? 3 : 2)].map((__, j) => (
              <Card key={j}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

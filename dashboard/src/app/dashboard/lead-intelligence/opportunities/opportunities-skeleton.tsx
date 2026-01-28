import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';

export function OpportunitiesSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Tabs + View Toggle */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((col) => (
          <div key={col} className="flex-shrink-0 w-72">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-6 rounded-full" />
                </div>
                {[1, 2, 3].map((card) => (
                  <div key={card} className="border rounded-md p-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

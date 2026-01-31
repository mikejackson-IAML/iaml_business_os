import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';

export function ProgramsSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border">
            {/* Header row */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/6" />
            </div>
            {/* Data rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/50">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

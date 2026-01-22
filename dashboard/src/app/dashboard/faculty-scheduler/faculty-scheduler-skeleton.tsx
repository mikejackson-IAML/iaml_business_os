import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { FallingPattern } from '@/components/ui/falling-pattern';

export function FacultySchedulerSkeleton() {
  return (
    <div className="relative min-h-screen">
      {/* Background pattern */}
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header skeleton */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-5 w-96 ml-11" />
        </header>

        {/* Summary Cards - 6 column grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid: 8 cols table + 4 cols sidebar */}
        <div className="grid grid-cols-12 gap-6">
          {/* Recruitment Pipeline Table */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                {/* Table header */}
                <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <Skeleton key={i} className="h-4 w-16" />
                  ))}
                </div>
                {/* Table rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border/50">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Not Responded List */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 mb-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-24 mb-3" />
                    <div className="space-y-2">
                      {[1, 2].map((j) => (
                        <div key={j} className="flex items-center justify-between">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

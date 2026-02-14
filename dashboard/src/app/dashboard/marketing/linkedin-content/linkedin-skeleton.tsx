import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { FallingPattern } from '@/components/ui/falling-pattern';

export function LinkedInContentSkeleton() {
  return (
    <div className="relative min-h-screen">
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
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-72" />
          </div>
          <Skeleton className="h-5 w-96" />
          <Skeleton className="h-4 w-48 mt-2" />
        </header>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-6">
          <div className="flex gap-2">
            {['This Week', 'Drafts', 'Calendar', 'Analytics', 'Engagement'].map((tab) => (
              <Skeleton key={tab} className="h-10 w-28 rounded-md" />
            ))}
          </div>

          {/* Content area skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-10 w-12 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

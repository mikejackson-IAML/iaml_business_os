import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { FallingPattern } from '@/components/ui/falling-pattern';

export function LeadsSkeleton() {
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
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-5 w-80" />
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Health Score */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <div className="h-1 bg-muted" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-60 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 mb-4">
                  <Skeleton className="h-14 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Key Metrics */}
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Capacity Gauge */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                      <Skeleton className="h-6 w-8 mx-auto" />
                      <Skeleton className="h-3 w-16 mx-auto mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Status */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-1 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Domain Health Table */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div>
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
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

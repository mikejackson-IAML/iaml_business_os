export function ContactProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>

      {/* Header skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex gap-6">
          <div className="h-16 w-16 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 rounded bg-muted" />
            <div className="h-4 w-64 rounded bg-muted" />
            <div className="flex gap-4">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-24 rounded bg-muted" />
        ))}
      </div>

      {/* Tab content skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

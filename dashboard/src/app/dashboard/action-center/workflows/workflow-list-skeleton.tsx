import { Skeleton } from "@/components/ui/skeleton";

export function WorkflowListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Filter bar skeleton (status + department dropdowns) */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg">
        {/* Table header */}
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Table rows - 5 rows matching WorkflowRow dimensions */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-b last:border-0 px-4 py-4">
            <div className="flex items-center gap-4">
              {/* Workflow name + description */}
              <div className="flex-1 space-y-1">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              {/* Department */}
              <Skeleton className="h-6 w-24" />
              {/* Status badge */}
              <Skeleton className="h-6 w-24" />
              {/* Progress */}
              <div className="w-24 space-y-1">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-12" />
              </div>
              {/* Target date */}
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

/**
 * WorkflowDetailSkeleton
 * Loading state for the workflow detail page.
 * Matches the layout of WorkflowDetailContent with:
 * - Back link
 * - Header (title, status badge, progress)
 * - Metadata row (dates, department)
 * - Task list with indentation variations
 */
export function WorkflowDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-32" />

      {/* Header skeleton */}
      <header className="space-y-3">
        {/* Title */}
        <Skeleton className="h-8 w-80" />
        {/* Description */}
        <Skeleton className="h-4 w-96" />
        {/* Status and progress row */}
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <Skeleton className="h-6 w-24 rounded" />
          {/* Progress text */}
          <Skeleton className="h-4 w-48" />
        </div>
      </header>

      {/* Metadata row skeleton */}
      <div className="flex items-center gap-6 py-4 border-y">
        {/* Department */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        {/* Target date */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
        {/* Started date */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>

      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Task list section */}
      <section className="space-y-4">
        {/* Section header */}
        <Skeleton className="h-6 w-16" />

        {/* Task list skeleton with varied indentation */}
        <div className="border rounded-lg divide-y">
          {/* Task row 1 - root level */}
          <div className="p-4 flex items-center gap-4">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Task row 2 - root level */}
          <div className="p-4 flex items-center gap-4">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-72" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Task row 3 - indented (dependency child) */}
          <div className="p-4 pl-8 flex items-center gap-4">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-56" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Task row 4 - root level */}
          <div className="p-4 flex items-center gap-4">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-60" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Task row 5 - indented (dependency child) */}
          <div className="p-4 pl-8 flex items-center gap-4">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </section>
    </div>
  );
}

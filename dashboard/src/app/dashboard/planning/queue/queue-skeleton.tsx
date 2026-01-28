'use client';

import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';

export function QueueSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card"
          >
            {/* Pin icon */}
            <Skeleton className="h-5 w-5 shrink-0" />
            {/* Rank */}
            <Skeleton className="h-6 w-8 shrink-0" />
            {/* Title and reasoning */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            {/* Score badge */}
            <Skeleton className="h-8 w-12 shrink-0 rounded-full" />
            {/* Doc count */}
            <Skeleton className="h-5 w-16 shrink-0" />
            {/* Actions */}
            <Skeleton className="h-8 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

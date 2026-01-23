'use client';

import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card } from '@/dashboard-kit/components/ui/card';

export default function ActionCenterSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" /> {/* Title */}
        <Skeleton className="h-10 w-96" /> {/* View tabs */}
      </div>

      {/* Filter toolbar */}
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
        <Skeleton className="h-10 w-64 ml-auto" /> {/* Search */}
      </div>

      {/* Table */}
      <Card>
        {/* Header */}
        <div className="flex border-b border-border px-6 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48 ml-8" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-24 ml-8" />
          <Skeleton className="h-4 w-24 ml-8" />
        </div>

        {/* Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center border-b border-border last:border-0 px-6 py-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-64 ml-8" />
            <Skeleton className="h-6 w-24 ml-auto" />
            <Skeleton className="h-6 w-24 ml-8" />
            <Skeleton className="h-6 w-24 ml-8" />
          </div>
        ))}
      </Card>
    </div>
  );
}

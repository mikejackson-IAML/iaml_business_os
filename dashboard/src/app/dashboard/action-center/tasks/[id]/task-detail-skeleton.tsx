'use client';

import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { FallingPattern } from '@/components/ui/falling-pattern';

/**
 * TaskDetailSkeleton
 * Loading state for the task detail page with two-column layout.
 */
export function TaskDetailSkeleton() {
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
        {/* Back navigation */}
        <div className="mb-6">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Header: title, badges, action buttons */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              {/* Title */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-96" />
                {/* Priority badge */}
                <Skeleton className="h-6 w-16 rounded-full" />
                {/* Status badge */}
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              {/* Task type and source */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>

            {/* Comments/Activity tabs */}
            <Card>
              <CardHeader>
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Activity/comment items */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 py-3 border-b border-border last:border-0">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Metadata card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-16" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-full" />
                </div>
                {/* Priority */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
                {/* Due date */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                {/* Department */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-28" />
                </div>
                {/* Assignee */}
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </CardContent>
            </Card>

            {/* Workflow card (if applicable) */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

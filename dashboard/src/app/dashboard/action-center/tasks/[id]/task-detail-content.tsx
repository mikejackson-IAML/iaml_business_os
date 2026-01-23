'use client';

// Placeholder component - will be fully implemented in plan 05-03
// This allows page.tsx to compile and the route to work

import type { TaskExtended, TaskComment, TaskActivity } from '@/lib/api/task-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TaskDetailContentProps {
  task: TaskExtended;
  comments: TaskComment[];
  activity: TaskActivity[];
}

/**
 * TaskDetailContent - Placeholder
 * Full implementation coming in plan 05-03
 */
export function TaskDetailContent({ task, comments, activity }: TaskDetailContentProps) {
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
        <Link
          href="/dashboard/action-center"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Action Center
        </Link>

        {/* Placeholder content */}
        <Card>
          <CardHeader>
            <CardTitle>{task.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Task detail view coming in plan 05-03.
            </p>
            <p className="text-sm mt-4">
              Comments: {comments.length} | Activity: {activity.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

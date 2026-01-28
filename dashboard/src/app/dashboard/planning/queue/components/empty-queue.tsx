'use client';

import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import type { ProjectStatus } from '@/dashboard-kit/types/departments/planning';
import { getStatusLabel } from '@/dashboard-kit/types/departments/planning';

interface EmptyQueueProps {
  statusCounts: Record<ProjectStatus, number>;
}

const DISPLAY_STATUSES: ProjectStatus[] = ['idea', 'planning', 'ready_to_build', 'building', 'shipped'];

export function EmptyQueue({ statusCounts }: EmptyQueueProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-6">
        <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium mb-2">No projects ready to build yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete planning phases to move projects here. Projects that finish the
            Package phase appear in the build queue, ranked by AI priority.
          </p>
        </div>

        {/* Status counts grid */}
        <div className="flex flex-wrap justify-center gap-4">
          {DISPLAY_STATUSES.map((status) => (
            <div
              key={status}
              className="flex flex-col items-center px-4 py-2 rounded-lg bg-muted/50"
            >
              <span className="text-xl font-bold text-foreground">
                {statusCounts[status] || 0}
              </span>
              <span className="text-xs text-muted-foreground">
                {getStatusLabel(status)}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View Pipeline
        </Link>
      </CardContent>
    </Card>
  );
}

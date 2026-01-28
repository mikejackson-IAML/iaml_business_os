'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { QueueItem } from './components/queue-item';
import { EmptyQueue } from './components/empty-queue';
import type { QueueProject, ProjectStatus } from '@/dashboard-kit/types/departments/planning';

interface QueueContentProps {
  projects: QueueProject[];
  statusCounts: Record<ProjectStatus, number>;
}

export function QueueContent({ projects, statusCounts }: QueueContentProps) {
  if (projects.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <header className="mb-8">
          <Link
            href="/dashboard/planning"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Pipeline</span>
          </Link>
          <h1 className="text-display-sm text-foreground">Build Queue</h1>
        </header>
        <EmptyQueue statusCounts={statusCounts} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header>
        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Pipeline</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="badge-live">QUEUE</span>
            <h1 className="text-display-sm text-foreground">Build Queue</h1>
            <span className="text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border bg-card hover:bg-accent transition-colors text-muted-foreground"
            disabled
            title="Refresh Priorities — coming soon"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Priorities
          </button>
        </div>
        <p className="text-muted-foreground mt-1">
          Projects ready to build, ranked by AI priority score
        </p>
      </header>

      {/* Queue List */}
      <div className="space-y-3">
        {projects.map((project, index) => (
          <QueueItem
            key={project.id}
            project={project}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

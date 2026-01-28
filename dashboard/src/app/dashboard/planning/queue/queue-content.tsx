'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { QueueItem } from './components/queue-item';
import { EmptyQueue } from './components/empty-queue';
import type { QueueProject, ProjectStatus } from '@/dashboard-kit/types/departments/planning';

interface QueueContentProps {
  projects: QueueProject[];
  statusCounts: Record<ProjectStatus, number>;
  goalsLastUpdated: number | null;
}

export function QueueContent({ projects, statusCounts, goalsLastUpdated }: QueueContentProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleDismissed, setStaleDismissed] = useState(false);

  // Check if priorities are stale (goals updated after oldest priority_updated_at)
  const isStale = !staleDismissed && (() => {
    if (!goalsLastUpdated) return false;
    // If any project has no priority score, it's stale
    const hasUnscored = projects.some((p) => p.priority_score == null);
    if (hasUnscored) return true;
    // If goals were updated after the oldest priority calculation
    const oldestPriority = Math.min(
      ...projects
        .filter((p) => p.priority_updated_at)
        .map((p) => new Date(p.priority_updated_at!).getTime())
    );
    if (!isFinite(oldestPriority)) return true;
    return goalsLastUpdated > oldestPriority;
  })();

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/planning/prioritize', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to calculate priorities');
        return;
      }
      setStaleDismissed(true);
      router.refresh();
    } catch {
      setError('Failed to connect to priority service');
    } finally {
      setRefreshing(false);
    }
  }

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
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border bg-card hover:bg-accent transition-colors text-muted-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Calculating...' : 'Refresh Priorities'}
          </button>
        </div>
        <p className="text-muted-foreground mt-1">
          Projects ready to build, ranked by AI priority score
        </p>
      </header>

      {/* Stale priorities banner */}
      {isStale && (
        <div className="flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Goals changed since last calculation. Refresh priorities to update scores.</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

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

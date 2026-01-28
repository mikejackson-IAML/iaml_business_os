'use client';

import Link from 'next/link';
import { Pin, PinOff, FileText } from 'lucide-react';
import { useTransition } from 'react';
import { togglePinAction } from '@/app/dashboard/planning/queue/actions';
import { QueueActions } from './queue-actions';
import type { QueueProject } from '@/dashboard-kit/types/departments/planning';

interface QueueItemProps {
  project: QueueProject;
  rank: number;
}

function ScoreBadge({ score }: { score: number | undefined | null }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center justify-center h-9 min-w-[3rem] px-2 rounded-full text-sm font-medium bg-muted text-muted-foreground">
        N/A
      </span>
    );
  }

  const colorClass =
    score > 70
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : score >= 40
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span className={`inline-flex items-center justify-center h-9 min-w-[3rem] px-2 rounded-full text-sm font-bold ${colorClass}`}>
      {Math.round(score)}
    </span>
  );
}

export function QueueItem({ project, rank }: QueueItemProps) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePin() {
    startTransition(() => {
      togglePinAction(project.id, !project.pinned);
    });
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Pin toggle */}
      <button
        onClick={handleTogglePin}
        disabled={isPending}
        className="shrink-0 text-muted-foreground hover:text-amber-500 transition-colors disabled:opacity-50"
        title={project.pinned ? 'Unpin project' : 'Pin to top'}
      >
        {project.pinned ? (
          <Pin className="h-5 w-5 text-amber-500 fill-amber-500" />
        ) : (
          <PinOff className="h-5 w-5" />
        )}
      </button>

      {/* Rank */}
      <span className="shrink-0 w-8 text-center text-lg font-bold text-muted-foreground">
        #{rank}
      </span>

      {/* Title and reasoning */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/dashboard/planning/${project.id}`}
          className="text-sm font-medium text-foreground hover:underline truncate block"
        >
          {project.title}
        </Link>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {project.priority_reasoning || 'Not yet prioritized'}
        </p>
      </div>

      {/* Score badge */}
      <ScoreBadge score={project.priority_score} />

      {/* Doc count */}
      <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        {project.document_count} doc{project.document_count !== 1 ? 's' : ''}
      </span>

      {/* Actions */}
      <QueueActions projectId={project.id} projectTitle={project.title} />
    </div>
  );
}

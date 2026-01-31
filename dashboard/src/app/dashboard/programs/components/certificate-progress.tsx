'use client';

import { Check, Circle, Award } from 'lucide-react';
import { cn, formatDateShort } from '@/dashboard-kit/lib/utils';
import type { ProgramBlock } from '@/lib/api/programs-queries';

interface CertificateProgressProps {
  certificateName: string;
  blocks: ProgramBlock[];
  completedBlockIds: string[];
}

export function CertificateProgress({
  certificateName,
  blocks,
  completedBlockIds,
}: CertificateProgressProps) {
  const completed = completedBlockIds.length;
  const total = blocks.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-lg border bg-card p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-amber-500" />
        <h4 className="font-medium">Certificate Progress</h4>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        {completed}/{total} blocks completed for {certificateName}
      </p>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted mb-4">
        <div
          className="h-2 rounded-full bg-amber-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Block list */}
      <div className="space-y-2">
        {blocks.map((block) => {
          const isCompleted = completedBlockIds.includes(block.id);
          return (
            <div key={block.id} className="flex items-center gap-2 text-sm">
              {isCompleted ? (
                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
              )}
              <span className={cn(
                isCompleted ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {block.shortName}: {block.name}
              </span>
              {block.startDate && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDateShort(block.startDate)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  FastForward,
  Send,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { skipTier, sendNudge } from '../actions';
import type { RecruitmentPipelineProgram } from '@/lib/api/faculty-scheduler-queries';

interface TableProps {
  programs: RecruitmentPipelineProgram[];
  onAssign: (programId: string) => void;
  onOverride: (claimId: string) => void;
}

// Status badge styling based on tier
function getStatusBadge(status: string, tierDisplay: string) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'outline'; className: string }> = {
    tier_0: { variant: 'default', className: 'bg-purple-600 hover:bg-purple-700 text-white' },
    tier_1: { variant: 'default', className: 'bg-blue-600 hover:bg-blue-700 text-white' },
    tier_2: { variant: 'default', className: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    filled: { variant: 'secondary', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    completed: { variant: 'secondary', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    draft: { variant: 'outline', className: '' },
  };

  const config = variants[status] || variants.draft;

  return (
    <Badge variant={config.variant} className={config.className}>
      {tierDisplay}
    </Badge>
  );
}

// Format date for display
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format days remaining
function formatDaysRemaining(days: number | null): string {
  if (days === null) return '-';
  if (days < 0) return 'Expired';
  if (days < 1) return '<1 day';
  return `${Math.round(days)}d`;
}

export function RecruitmentPipelineTable({ programs, onAssign, onOverride }: TableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionProgramId, setActionProgramId] = useState<string | null>(null);

  const handleSkipTier = async (programId: string, targetTier: 'tier_1' | 'tier_2') => {
    setActionProgramId(programId);
    startTransition(async () => {
      const result = await skipTier(programId, targetTier);
      if (!result.success) {
        // TODO: Show toast error
        console.error('Skip tier failed:', result.error);
      }
      setActionProgramId(null);
    });
  };

  const handleSendNudge = async (programId: string) => {
    setActionProgramId(programId);
    startTransition(async () => {
      const result = await sendNudge(programId);
      if (!result.success) {
        // TODO: Show toast error
        console.error('Send nudge failed:', result.error);
      } else {
        // TODO: Show toast success
        console.log('Nudge sent to', result.data?.instructorCount, 'instructors');
      }
      setActionProgramId(null);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md">Recruitment Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm">
                <th className="pb-3 font-medium text-muted-foreground">Program</th>
                <th className="pb-3 font-medium text-muted-foreground">Date</th>
                <th className="pb-3 font-medium text-muted-foreground">Location</th>
                <th className="pb-3 font-medium text-muted-foreground">Tier</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Time Left</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Notified</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Responded</th>
                <th className="pb-3 font-medium text-muted-foreground">Assigned</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <ProgramRow
                  key={program.id}
                  program={program}
                  isPending={isPending && actionProgramId === program.id}
                  onSkipTier={(target) => handleSkipTier(program.id, target)}
                  onSendNudge={() => handleSendNudge(program.id)}
                  onAssign={() => onAssign(program.id)}
                  onOverride={onOverride}
                />
              ))}
              {programs.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No programs in recruitment pipeline
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgramRowProps {
  program: RecruitmentPipelineProgram;
  isPending: boolean;
  onSkipTier: (target: 'tier_1' | 'tier_2') => void;
  onSendNudge: () => void;
  onAssign: () => void;
  onOverride: (claimId: string) => void;
}

function ProgramRow({ program, isPending, onSkipTier, onSendNudge, onAssign, onOverride }: ProgramRowProps) {
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside handler to close dropdown
  useEffect(() => {
    if (!showActions) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    }

    // Add listener on next tick to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!showActions) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowActions(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showActions]);

  // Determine available actions based on program state
  const canSkipToTier1 = program.status === 'tier_0';
  const canSkipToTier2 = program.status === 'tier_0' || program.status === 'tier_1';
  const canNudge = ['tier_0', 'tier_1', 'tier_2'].includes(program.status) && program.open_blocks > 0;
  const canAssign = ['tier_0', 'tier_1', 'tier_2'].includes(program.status) && program.open_blocks > 0;
  const hasClaim = program.filled_blocks > 0;

  return (
    <tr className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-3">
        <div>
          <p className="font-medium text-foreground">{program.name}</p>
          <p className="text-sm text-muted-foreground">
            {program.open_blocks}/{program.total_blocks} blocks open
          </p>
        </div>
      </td>
      <td className="py-3">
        <span className="text-sm">{formatDate(program.start_date)}</span>
      </td>
      <td className="py-3">
        <span className="text-sm">
          {program.city && program.state ? `${program.city}, ${program.state}` : '-'}
        </span>
      </td>
      <td className="py-3">
        {getStatusBadge(program.status, program.tier_display)}
      </td>
      <td className="py-3 text-right">
        <span className={`text-sm font-medium ${
          program.days_remaining !== null && program.days_remaining < 2
            ? 'text-amber-500'
            : ''
        }`}>
          {formatDaysRemaining(program.days_remaining)}
        </span>
      </td>
      <td className="py-3 text-right">
        <span className="text-sm">{program.notified_count}</span>
      </td>
      <td className="py-3 text-right">
        <span className="text-sm">{program.responded_count}</span>
      </td>
      <td className="py-3">
        {program.assigned_instructor_name ? (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {program.assigned_instructor_name}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-3 text-right">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            disabled={isPending}
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-border bg-card shadow-lg z-10">
              <div className="p-1">
                {canSkipToTier1 && (
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { onSkipTier('tier_1'); setShowActions(false); }}
                    disabled={isPending}
                  >
                    <FastForward className="h-4 w-4" />
                    Skip to Tier 1
                  </button>
                )}
                {canSkipToTier2 && (
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { onSkipTier('tier_2'); setShowActions(false); }}
                    disabled={isPending}
                  >
                    <FastForward className="h-4 w-4" />
                    Skip to Open
                  </button>
                )}
                {canNudge && (
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { onSendNudge(); setShowActions(false); }}
                    disabled={isPending}
                  >
                    <Send className="h-4 w-4" />
                    Send Reminder
                  </button>
                )}
                {canAssign && (
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => { onAssign(); setShowActions(false); }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Assign Instructor
                  </button>
                )}
                {hasClaim && (
                  <button
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => {
                      // Pass program ID - the override modal will fetch claims for this program
                      onOverride(program.id);
                      setShowActions(false);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Override Claim
                  </button>
                )}
                {!canSkipToTier1 && !canSkipToTier2 && !canNudge && !canAssign && !hasClaim && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    No actions available
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

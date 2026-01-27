'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Loader2, Timer } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { completePhaseAction } from '../../actions';
import { getPhaseLabel } from '@/dashboard-kit/types/departments/planning';
import type { PhaseType } from '@/dashboard-kit/types/departments/planning';

interface PhaseTransitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentPhase: PhaseType;
  nextPhase: PhaseType;
  incubationHours: number;
  readinessResult?: { passed: boolean; reason?: string } | null;
}

export function PhaseTransitionModal({
  open,
  onOpenChange,
  projectId,
  currentPhase,
  nextPhase,
  incubationHours,
  readinessResult,
}: PhaseTransitionModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await completePhaseAction(projectId, currentPhase);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Complete {getPhaseLabel(currentPhase)} phase?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {incubationHours > 0 ? (
                <p className="flex items-start gap-2">
                  <Timer className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                  <span>
                    After completing this phase, there will be a{' '}
                    <strong>{incubationHours}-hour incubation period</strong>{' '}
                    before you can start {getPhaseLabel(nextPhase)}. This helps
                    you return with fresh perspective.
                  </span>
                </p>
              ) : (
                <p>
                  You&apos;ll move directly to{' '}
                  <strong>{getPhaseLabel(nextPhase)}</strong>.
                </p>
              )}

              {readinessResult?.passed === false && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Readiness check flagged: {readinessResult.reason || 'Unknown issue'}.
                    You can still proceed, but consider addressing the feedback first.
                  </span>
                </div>
              )}

              {readinessResult?.passed === true && (
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Readiness check passed</span>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              'Complete Phase'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { forceCompletePhaseAction } from '../../actions';
import type { PhaseType } from '@/dashboard-kit/types/departments/planning';

interface ForceCompleteButtonProps {
  projectId: string;
  currentPhase: PhaseType;
}

export function ForceCompleteButton({
  projectId,
  currentPhase,
}: ForceCompleteButtonProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleForceComplete() {
    startTransition(async () => {
      await forceCompletePhaseAction(projectId, currentPhase);
      setShowWarning(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded-md hover:bg-muted transition-colors">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setShowWarning(true)}>
            Complete phase manually
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force complete phase?</AlertDialogTitle>
            <AlertDialogDescription>
              Claude hasn&apos;t confirmed this phase is complete.
              Force-completing may skip important steps. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceComplete} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Force Complete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

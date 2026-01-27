'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Save } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { PlanningProject } from '@/dashboard-kit/types/departments/planning';
import { getIncubationTimeRemaining } from '@/dashboard-kit/types/departments/planning';
import { skipIncubationAction, saveIncubationNoteAction } from '../../actions';

interface IncubationOverlayProps {
  project: PlanningProject;
}

export function IncubationOverlay({ project }: IncubationOverlayProps) {
  const router = useRouter();
  const [skipPending, startSkipTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [timeRemaining, setTimeRemaining] = useState<string | null>(
    getIncubationTimeRemaining(project)
  );
  const [noteText, setNoteText] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  // Live countdown timer -- updates every 60 seconds
  useEffect(() => {
    function tick() {
      const remaining = getIncubationTimeRemaining(project);
      setTimeRemaining(remaining);

      // If incubation has expired, refresh to show conversation
      if (!remaining) {
        router.refresh();
      }
    }

    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [project, router]);

  function handleSkipConfirm() {
    startSkipTransition(async () => {
      const result = await skipIncubationAction(project.id);
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleSaveNote() {
    if (!noteText.trim()) return;
    const text = noteText.trim();
    startSaveTransition(async () => {
      const result = await saveIncubationNoteAction(project.id, text);
      if (result.success) {
        setSavedNotes((prev) => [...prev, text]);
        setNoteText('');
      }
    });
  }

  return (
    <Card className="h-full min-h-[500px] flex flex-col">
      <CardContent className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md w-full">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-amber-500/10 p-4">
              <Moon className="h-10 w-10 text-amber-500" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Let this idea marinate
            </h2>
            {timeRemaining && (
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {timeRemaining}
              </p>
            )}
          </div>

          {/* Supporting text */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Great work getting here. Your subconscious is making connections
            while you wait. Come back refreshed.
          </p>

          {/* Idea capture area */}
          <div className="text-left space-y-3">
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              rows={3}
              placeholder="Jot down any ideas that come to mind..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveNote}
              disabled={savePending || !noteText.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {savePending ? 'Saving...' : 'Save Note'}
            </Button>

            {/* Saved notes list */}
            {savedNotes.length > 0 && (
              <ul className="space-y-1 pt-2">
                {savedNotes.map((note, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-1.5"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Skip incubation */}
          <div className="pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  disabled={skipPending}
                >
                  {skipPending ? 'Skipping...' : 'Skip Incubation'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Skip incubation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Incubation helps you think more clearly about your idea.
                    Taking a break often leads to better decisions. Are you sure
                    you want to skip?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSkipConfirm}>
                    Yes, skip
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

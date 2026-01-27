'use client';

import { useState } from 'react';
import { Moon, FileText, MessageSquare } from 'lucide-react';
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
import { getApproximateIncubationTime } from '@/dashboard-kit/types/departments/planning';

interface IncubationOverlayProps {
  project: PlanningProject;
}

export function IncubationOverlay({ project }: IncubationOverlayProps) {
  const [skipping, setSkipping] = useState(false);
  const approximateTime = getApproximateIncubationTime(project);

  function handleSkipConfirm() {
    setSkipping(true);
    // Placeholder: actual skip action will be implemented in Phase 5
    console.log('Skip incubation confirmed for project:', project.id);
    // Reset after a moment to show we handled it
    setTimeout(() => setSkipping(false), 1000);
  }

  return (
    <Card className="h-full min-h-[500px] flex flex-col">
      <CardContent className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
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
            {approximateTime && (
              <p className="text-sm font-medium text-muted-foreground">
                {approximateTime}
              </p>
            )}
          </div>

          {/* Supporting text */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Great work getting here. Your subconscious is making connections
            while you wait. Come back refreshed.
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled>
              <FileText className="h-4 w-4 mr-2" />
              View Documents
            </Button>
            <Button variant="outline" size="sm" disabled>
              <MessageSquare className="h-4 w-4 mr-2" />
              Review Conversations
            </Button>
          </div>

          {/* Skip incubation */}
          <div className="pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  disabled={skipping}
                >
                  {skipping ? 'Skipping...' : 'Skip Incubation'}
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

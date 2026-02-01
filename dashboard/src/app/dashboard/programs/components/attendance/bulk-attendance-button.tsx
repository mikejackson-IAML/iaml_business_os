'use client';

import { useState } from 'react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
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

interface BulkAttendanceButtonProps {
  programId: string;
  blockIds: string[];
  registrationCount: number;
  onComplete?: () => void;
}

/**
 * Mark all registrants as attended for all their registered blocks
 * Per CONTEXT.md: Brief confirmation before bulk update
 */
export function BulkAttendanceButton({
  programId,
  blockIds,
  registrationCount,
  onComplete,
}: BulkAttendanceButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleMarkAll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/programs/${programId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markAll: true,
          blockIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'All attendees marked as attended');
        onComplete?.();
      } else {
        toast.error(data.error || 'Failed to mark attendance');
      }
    } catch {
      toast.error('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  }

  if (registrationCount === 0) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Mark All Attended
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark all as attended?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark {registrationCount} registrant(s) as attended for all
            their registered blocks. This action can be undone by unchecking
            individual boxes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkAll} disabled={loading}>
            {loading ? 'Marking...' : 'Mark All Attended'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

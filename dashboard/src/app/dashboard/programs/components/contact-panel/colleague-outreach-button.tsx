'use client';

import { useState } from 'react';
import { Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { toast } from 'sonner';
import type { RegistrationRosterItem } from '@/lib/api/programs-queries';

interface ColleagueOutreachButtonProps {
  registration: RegistrationRosterItem;
}

type WorkflowStatus = 'not_started' | 'triggering' | 'triggered' | 'error';

export function ColleagueOutreachButton({ registration }: ColleagueOutreachButtonProps) {
  const [status, setStatus] = useState<WorkflowStatus>('not_started');
  const [triggeredAt, setTriggeredAt] = useState<Date | null>(null);

  async function handleTrigger() {
    if (status === 'triggering') return;

    setStatus('triggering');

    try {
      const response = await fetch('/api/programs/colleague-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registration.email,
          companyName: registration.company_name,
          registrantName: registration.full_name,
          programName: registration.program_name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger workflow');
      }

      setStatus('triggered');
      setTriggeredAt(new Date());
      toast.success('Colleague outreach triggered', {
        description: `Workflow started for ${registration.company_name}`,
      });
    } catch (error) {
      setStatus('error');
      toast.error('Failed to trigger outreach', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Render status badge
  function renderStatus() {
    switch (status) {
      case 'triggered':
        return (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Triggered {triggeredAt && formatRelativeTime(triggeredAt)}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Failed - click to retry</span>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleTrigger}
        disabled={status === 'triggering' || !registration.company_name}
        variant={status === 'triggered' ? 'outline' : 'default'}
        className="w-full"
      >
        {status === 'triggering' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Triggering...
          </>
        ) : (
          <>
            <Users className="h-4 w-4 mr-2" />
            Trigger Colleague Outreach
          </>
        )}
      </Button>

      {renderStatus()}

      {!registration.company_name && (
        <p className="text-xs text-muted-foreground">
          Company name required for colleague outreach
        </p>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

'use client';

import { useState } from 'react';
import { Video, Calendar, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, InlineTextField, StatusIndicator } from './logistics-card';
import type { ProgramLogistics } from '@/lib/api/programs-queries';

interface VirtualCardProps {
  programId: string;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

/**
 * Platform Ready Card - Virtual-only
 * Tracks platform link and readiness
 */
export function PlatformReadyCard({ programId, logistics, onUpdate }: VirtualCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isReady = logistics.platform_ready;
  const hasLink = !!logistics.platform_link;

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not ready';

  if (isReady && hasLink) {
    status = 'complete';
    summary = 'Ready';
  } else if (hasLink) {
    status = 'warning';
    summary = 'Link added (not confirmed)';
  }

  async function saveField(field: string, value: unknown) {
    try {
      const res = await fetch(`/api/programs/${programId}/logistics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      if (res.ok) {
        toast.success('Saved');
        onUpdate();
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    }
  }

  return (
    <LogisticsCard
      title="Platform/Link"
      icon={<Video className="h-4 w-4 text-blue-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <InlineTextField
          label="Meeting Link"
          value={logistics.platform_link || ''}
          onSave={(val) => saveField('platform_link', val)}
          placeholder="Zoom/Teams/Meet link"
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!logistics.platform_ready}
            onChange={() => {
              const newValue = !logistics.platform_ready;
              saveField('platform_ready', newValue);
              saveField('platform_ready_at', newValue ? new Date().toISOString() : null);
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Platform ready</span>
        </label>
      </div>
    </LogisticsCard>
  );
}

/**
 * Calendar Invites Card - Virtual-only
 */
export function CalendarInvitesCard({ programId, logistics, onUpdate }: VirtualCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sent = logistics.calendar_invites_sent;

  const status: StatusIndicator = sent ? 'complete' : 'incomplete';
  const summary = sent ? 'Sent' : 'Not sent';

  async function saveField(field: string, value: unknown) {
    try {
      const res = await fetch(`/api/programs/${programId}/logistics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      if (res.ok) {
        toast.success('Saved');
        onUpdate();
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    }
  }

  return (
    <LogisticsCard
      title="Calendar Invites"
      icon={<Calendar className="h-4 w-4 text-green-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!logistics.calendar_invites_sent}
            onChange={() => {
              const newValue = !logistics.calendar_invites_sent;
              saveField('calendar_invites_sent', newValue);
              saveField('calendar_invites_at', newValue ? new Date().toISOString() : null);
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Calendar invites sent to registrants</span>
        </label>

        {logistics.calendar_invites_at && (
          <p className="text-xs text-muted-foreground">
            Sent on {new Date(logistics.calendar_invites_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </LogisticsCard>
  );
}

/**
 * Reminder Emails Card - Virtual-only
 */
export function ReminderEmailsCard({ programId, logistics, onUpdate }: VirtualCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sent = logistics.reminder_emails_sent;

  const status: StatusIndicator = sent ? 'complete' : 'incomplete';
  const summary = sent ? 'Scheduled' : 'Not scheduled';

  async function saveField(field: string, value: unknown) {
    try {
      const res = await fetch(`/api/programs/${programId}/logistics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      if (res.ok) {
        toast.success('Saved');
        onUpdate();
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    }
  }

  return (
    <LogisticsCard
      title="Reminder Emails"
      icon={<Bell className="h-4 w-4 text-amber-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!logistics.reminder_emails_sent}
            onChange={() => {
              const newValue = !logistics.reminder_emails_sent;
              saveField('reminder_emails_sent', newValue);
              saveField('reminder_emails_at', newValue ? new Date().toISOString() : null);
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Reminder emails scheduled</span>
        </label>

        {logistics.reminder_emails_at && (
          <p className="text-xs text-muted-foreground">
            Scheduled on {new Date(logistics.reminder_emails_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </LogisticsCard>
  );
}

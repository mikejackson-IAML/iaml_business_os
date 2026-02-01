'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, InlineTextField, StatusIndicator } from './logistics-card';
import type { ProgramLogistics } from '@/lib/api/programs-queries';

interface InstructorCardProps {
  programId: string;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

/**
 * Instructor assignment card (PROG-34)
 * Shows instructor name, contact, and confirmation status
 */
export function InstructorCard({ programId, logistics, onUpdate }: InstructorCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine status
  const hasInstructor = !!logistics.instructor_name;
  const isConfirmed = !!logistics.instructor_confirmed_at;

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not assigned';

  if (hasInstructor && isConfirmed) {
    status = 'complete';
    summary = `${logistics.instructor_name} (confirmed)`;
  } else if (hasInstructor) {
    status = 'warning';
    summary = `${logistics.instructor_name} (pending confirmation)`;
  }

  async function saveField(field: string, value: string | null) {
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

  async function toggleConfirmed() {
    const newValue = logistics.instructor_confirmed_at
      ? null
      : new Date().toISOString();
    await saveField('instructor_confirmed_at', newValue);
  }

  return (
    <LogisticsCard
      title="Instructor"
      icon={<User className="h-4 w-4 text-blue-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <InlineTextField
          label="Name"
          value={logistics.instructor_name || ''}
          onSave={(val) => saveField('instructor_name', val)}
          placeholder="Enter instructor name"
        />
        <InlineTextField
          label="Contact Info"
          value={logistics.instructor_contact || ''}
          onSave={(val) => saveField('instructor_contact', val)}
          placeholder="Phone or email"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!logistics.instructor_confirmed_at}
            onChange={toggleConfirmed}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Confirmed</span>
          {logistics.instructor_confirmed_at && (
            <span className="text-xs text-muted-foreground">
              ({new Date(logistics.instructor_confirmed_at).toLocaleDateString()})
            </span>
          )}
        </label>
      </div>
    </LogisticsCard>
  );
}

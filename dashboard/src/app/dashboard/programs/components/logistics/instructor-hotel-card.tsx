'use client';

import { useState } from 'react';
import { Building } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, InlineTextField, StatusIndicator } from './logistics-card';
import type { ProgramLogistics } from '@/lib/api/programs-queries';

interface InstructorHotelCardProps {
  programId: string;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

/**
 * Instructor hotel booking card (PROG-36)
 * Tracks instructor's hotel booking for the program
 */
export function InstructorHotelCard({ programId, logistics, onUpdate }: InstructorHotelCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine status
  const isBooked = !!logistics.instructor_hotel_confirmation;
  const hasName = !!logistics.instructor_hotel_name;

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not booked';

  if (isBooked) {
    status = 'complete';
    summary = `${logistics.instructor_hotel_name || 'Hotel'} - ${logistics.instructor_hotel_dates || 'dates TBD'}`;
  } else if (hasName) {
    status = 'warning';
    summary = `${logistics.instructor_hotel_name} (no confirmation)`;
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

  async function saveConfirmation(val: string) {
    await saveField('instructor_hotel_confirmation', val);
    // Auto-set booked_at timestamp when confirmation added
    if (val && !logistics.instructor_hotel_booked_at) {
      await saveField('instructor_hotel_booked_at', new Date().toISOString());
    }
  }

  return (
    <LogisticsCard
      title="Instructor Hotel"
      icon={<Building className="h-4 w-4 text-violet-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <InlineTextField
          label="Hotel Name"
          value={logistics.instructor_hotel_name || ''}
          onSave={(val) => saveField('instructor_hotel_name', val)}
          placeholder="Enter hotel name"
        />
        <InlineTextField
          label="Dates"
          value={logistics.instructor_hotel_dates || ''}
          onSave={(val) => saveField('instructor_hotel_dates', val)}
          placeholder="e.g., Oct 14-19"
        />
        <InlineTextField
          label="Confirmation Number"
          value={logistics.instructor_hotel_confirmation || ''}
          onSave={saveConfirmation}
          placeholder="Enter confirmation #"
        />
      </div>
    </LogisticsCard>
  );
}

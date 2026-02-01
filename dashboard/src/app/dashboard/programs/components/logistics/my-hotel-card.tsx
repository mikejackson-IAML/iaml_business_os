'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, InlineTextField, StatusIndicator } from './logistics-card';
import type { ProgramLogistics } from '@/lib/api/programs-queries';

interface MyHotelCardProps {
  programId: string;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

/**
 * My hotel booking card (PROG-35)
 * Tracks personal hotel booking for the program
 */
export function MyHotelCard({ programId, logistics, onUpdate }: MyHotelCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine status based on confirmation number
  const isBooked = !!logistics.my_hotel_confirmation;
  const hasName = !!logistics.my_hotel_name;

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not booked';

  if (isBooked) {
    status = 'complete';
    summary = `${logistics.my_hotel_name || 'Hotel'} - ${logistics.my_hotel_dates || 'dates TBD'}`;
  } else if (hasName) {
    status = 'warning';
    summary = `${logistics.my_hotel_name} (no confirmation)`;
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
    await saveField('my_hotel_confirmation', val);
    // Auto-set booked_at timestamp when confirmation added
    if (val && !logistics.my_hotel_booked_at) {
      await saveField('my_hotel_booked_at', new Date().toISOString());
    }
  }

  return (
    <LogisticsCard
      title="My Hotel"
      icon={<Building2 className="h-4 w-4 text-indigo-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <InlineTextField
          label="Hotel Name"
          value={logistics.my_hotel_name || ''}
          onSave={(val) => saveField('my_hotel_name', val)}
          placeholder="Enter hotel name"
        />
        <InlineTextField
          label="Dates"
          value={logistics.my_hotel_dates || ''}
          onSave={(val) => saveField('my_hotel_dates', val)}
          placeholder="e.g., Oct 15-18"
        />
        <InlineTextField
          label="Confirmation Number"
          value={logistics.my_hotel_confirmation || ''}
          onSave={saveConfirmation}
          placeholder="Enter confirmation #"
        />
      </div>
    </LogisticsCard>
  );
}

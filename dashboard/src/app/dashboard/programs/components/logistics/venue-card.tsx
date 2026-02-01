'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, InlineTextField, StatusIndicator } from './logistics-card';
import type { ProgramLogistics, ProgramDetail } from '@/lib/api/programs-queries';

interface VenueCardProps {
  programId: string;
  program: ProgramDetail;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

export function VenueCard({ programId, program, logistics, onUpdate }: VenueCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Use venue_name from program if available
  const venueName = program.venue_name || logistics.venue_location;
  const hasLocation = !!venueName;
  const isConfirmed = !!logistics.venue_confirmed_at;

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not confirmed';

  if (isConfirmed) {
    status = 'complete';
    summary = venueName || 'Confirmed';
    if (logistics.venue_daily_rate) {
      summary += ` - $${logistics.venue_daily_rate}/day`;
    }
  } else if (hasLocation) {
    status = 'warning';
    summary = `${venueName} (pending confirmation)`;
  }

  async function saveField(field: string, value: string | number | null) {
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
      title="Venue"
      icon={<MapPin className="h-4 w-4 text-rose-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <InlineTextField
          label="Location"
          value={logistics.venue_location || program.venue_name || ''}
          onSave={(val) => saveField('venue_location', val)}
          placeholder="Venue name and address"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Daily Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                value={logistics.venue_daily_rate || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  saveField('venue_daily_rate', val);
                }}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              F&B Minimum
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                value={logistics.venue_fb_minimum || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  saveField('venue_fb_minimum', val);
                }}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-2 border-t">
          <input
            type="checkbox"
            checked={!!logistics.venue_confirmed_at}
            onChange={() => {
              const newValue = logistics.venue_confirmed_at
                ? null
                : new Date().toISOString();
              saveField('venue_confirmed_at', newValue);
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Venue confirmed</span>
          {logistics.venue_confirmed_at && (
            <span className="text-xs text-muted-foreground">
              ({new Date(logistics.venue_confirmed_at).toLocaleDateString()})
            </span>
          )}
        </label>
      </div>
    </LogisticsCard>
  );
}

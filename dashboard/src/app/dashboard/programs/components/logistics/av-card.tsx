'use client';

import { useState } from 'react';
import { Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, InlineTextField, StatusIndicator } from './logistics-card';
import type { ProgramLogistics } from '@/lib/api/programs-queries';

interface AVCardProps {
  programId: string;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

export function AVCard({ programId, logistics, onUpdate }: AVCardProps) {
  const [expanded, setExpanded] = useState(false);

  const purchased = logistics.av_purchased;
  const shipped = logistics.av_shipped;
  const hasTracking = !!logistics.av_tracking;

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not purchased';

  if (shipped && hasTracking) {
    status = 'complete';
    summary = 'Shipped';
  } else if (shipped) {
    status = 'warning';
    summary = 'Shipped (no tracking)';
  } else if (purchased) {
    status = 'warning';
    summary = 'Purchased (not shipped)';
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

  async function toggleField(field: string, timestampField: string) {
    const currentValue = logistics[field as keyof ProgramLogistics];
    const newValue = !currentValue;

    await saveField(field, newValue);
    await saveField(timestampField, newValue ? new Date().toISOString() : null);
  }

  return (
    <LogisticsCard
      title="AV Equipment"
      icon={<Monitor className="h-4 w-4 text-purple-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!logistics.av_purchased}
            onChange={() => toggleField('av_purchased', 'av_purchased_at')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Purchased</span>
          {logistics.av_purchased_at && (
            <span className="text-xs text-muted-foreground">
              ({new Date(logistics.av_purchased_at).toLocaleDateString()})
            </span>
          )}
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!logistics.av_shipped}
            onChange={() => toggleField('av_shipped', 'av_shipped_at')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Shipped</span>
          {logistics.av_shipped_at && (
            <span className="text-xs text-muted-foreground">
              ({new Date(logistics.av_shipped_at).toLocaleDateString()})
            </span>
          )}
        </label>

        {logistics.av_shipped && (
          <InlineTextField
            label="Tracking Number"
            value={logistics.av_tracking || ''}
            onSave={(val) => saveField('av_tracking', val)}
            placeholder="Enter tracking number"
          />
        )}
      </div>
    </LogisticsCard>
  );
}

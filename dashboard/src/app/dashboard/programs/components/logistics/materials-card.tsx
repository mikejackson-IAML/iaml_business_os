'use client';

import { useState } from 'react';
import { Package, Check } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, InlineTextField, StatusIndicator } from './logistics-card';
import type { ProgramLogistics } from '@/lib/api/programs-queries';

interface MaterialsCardProps {
  programId: string;
  logistics: ProgramLogistics;
  isVirtual: boolean;
  onUpdate: () => void;
}

// 7 materials checklist items per PROG-40
const MATERIALS_ITEMS = [
  { id: 'instructor_assigned', label: 'Instructor Assigned', field: 'instructor_name', checkField: null },
  { id: 'sent', label: 'Materials Sent to Instructor', field: 'materials_sent_to_instructor', timestampField: 'materials_sent_at' },
  { id: 'feedback', label: 'Feedback Received', field: 'materials_feedback_received', timestampField: 'materials_feedback_at' },
  { id: 'updated', label: 'Materials Updated', field: 'materials_updated', timestampField: 'materials_updated_at' },
  { id: 'printed', label: 'Sent to Print', field: 'materials_printed', timestampField: 'materials_printed_at' },
  { id: 'shipped', label: 'Shipped', field: 'materials_shipped', timestampField: 'materials_shipped_at' },
  { id: 'tracking', label: 'Tracking Added', field: 'materials_tracking', checkField: null },
] as const;

export function MaterialsCard({ programId, logistics, isVirtual, onUpdate }: MaterialsCardProps) {
  const [expanded, setExpanded] = useState(false);

  // For virtual, only show first 4 items (no printing/shipping)
  const items = isVirtual ? MATERIALS_ITEMS.slice(0, 4) : MATERIALS_ITEMS;

  // Count completed items
  const completed = items.filter((item) => {
    if (item.id === 'instructor_assigned') return !!logistics.instructor_name;
    if (item.id === 'tracking') return !!logistics.materials_tracking;
    return logistics[item.field as keyof ProgramLogistics];
  }).length;

  const status: StatusIndicator =
    completed === items.length ? 'complete' :
    completed >= items.length / 2 ? 'warning' : 'incomplete';

  const summary = `${completed}/${items.length} complete`;

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

  async function toggleItem(item: typeof MATERIALS_ITEMS[number]) {
    if (item.id === 'instructor_assigned' || item.id === 'tracking') return;

    const currentValue = logistics[item.field as keyof ProgramLogistics];
    const newValue = !currentValue;

    await saveField(item.field, newValue);

    // Also set timestamp
    if ('timestampField' in item && item.timestampField) {
      const timestamp = newValue ? new Date().toISOString() : null;
      await saveField(item.timestampField, timestamp);
    }
  }

  function isItemChecked(item: typeof MATERIALS_ITEMS[number]): boolean {
    if (item.id === 'instructor_assigned') return !!logistics.instructor_name;
    if (item.id === 'tracking') return !!logistics.materials_tracking;
    return !!logistics[item.field as keyof ProgramLogistics];
  }

  return (
    <LogisticsCard
      title="Materials"
      icon={<Package className="h-4 w-4 text-cyan-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-2">
        {items.map((item) => {
          const checked = isItemChecked(item);
          const isToggleable = item.id !== 'instructor_assigned' && item.id !== 'tracking';

          return (
            <div key={item.id} className="flex items-start gap-2">
              {isToggleable ? (
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(item)}
                  className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              ) : (
                <div className={`h-4 w-4 mt-0.5 rounded flex items-center justify-center ${
                  checked ? 'bg-emerald-500' : 'border border-gray-300'
                }`}>
                  {checked && <Check className="h-3 w-3 text-white" />}
                </div>
              )}
              <div className="flex-1">
                <span className="text-sm">{item.label}</span>
                {item.id === 'instructor_assigned' && !checked && (
                  <span className="text-xs text-muted-foreground block">
                    Set in Instructor card above
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Tracking number field - only show for in-person and when shipped */}
        {!isVirtual && logistics.materials_shipped && (
          <div className="pt-2 border-t">
            <InlineTextField
              label="Tracking Number"
              value={logistics.materials_tracking || ''}
              onSave={(val) => saveField('materials_tracking', val)}
              placeholder="Enter tracking number"
            />
          </div>
        )}
      </div>
    </LogisticsCard>
  );
}

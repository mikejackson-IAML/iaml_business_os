'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { LogisticsCard, StatusIndicator } from './logistics-card';
import type { ProgramLogistics, ProgramDetail } from '@/lib/api/programs-queries';

interface RoomBlockCardProps {
  programId: string;
  program: ProgramDetail;
  logistics: ProgramLogistics;
  onUpdate: () => void;
}

/**
 * Room block card (PROG-37)
 * Shows room block details from program_dashboard_summary view
 * and tracks logistics confirmation status
 */
export function RoomBlockCard({ programId, program, logistics, onUpdate }: RoomBlockCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Use room_blocks data from program if available
  // Per RESEARCH.md: reference room_blocks table, don't duplicate data
  const hotelName = program.room_block_hotel || '';
  const roomsBooked = program.rooms_booked || 0;
  const blockSize = program.block_size || 0;
  const cutoffDate = program.room_block_cutoff;

  const isSecured = !!logistics.room_block_secured_at || !!hotelName;
  const utilization = blockSize > 0 ? Math.round((roomsBooked / blockSize) * 100) : 0;

  let status: StatusIndicator = 'incomplete';
  let summary = 'Not secured';

  if (isSecured && blockSize > 0) {
    if (utilization >= 80) {
      status = 'complete';
    } else if (utilization >= 50) {
      status = 'warning';
    } else {
      status = 'incomplete';
    }
    summary = `${roomsBooked}/${blockSize} rooms (${utilization}%)`;
    if (cutoffDate) {
      const daysUntil = Math.ceil((new Date(cutoffDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0 && daysUntil <= 14) {
        summary += ` - ${daysUntil}d to cutoff`;
      }
    }
  } else if (hotelName) {
    status = 'warning';
    summary = `${hotelName} - awaiting details`;
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

  async function toggleSecured() {
    const newValue = logistics.room_block_secured_at
      ? null
      : new Date().toISOString();
    await saveField('room_block_secured_at', newValue);
  }

  return (
    <LogisticsCard
      title="Room Block"
      icon={<Users className="h-4 w-4 text-teal-500" />}
      statusSummary={summary}
      statusIndicator={status}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-3">
        {/* Display room_blocks data (read-only from that table) */}
        {hotelName && (
          <div className="text-sm">
            <span className="text-muted-foreground">Hotel:</span>{' '}
            <span className="font-medium">{hotelName}</span>
          </div>
        )}

        {blockSize > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Block:</span>{' '}
            <span className="font-medium">{roomsBooked} booked / {blockSize} rooms</span>
          </div>
        )}

        {cutoffDate && (
          <div className="text-sm">
            <span className="text-muted-foreground">Cutoff Date:</span>{' '}
            <span className="font-medium">{new Date(cutoffDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Progress bar */}
        {blockSize > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Pickup Progress</span>
              <span>{utilization}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  utilization >= 80 ? 'bg-emerald-500' :
                  utilization >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Mark as secured checkbox */}
        <label className="flex items-center gap-2 cursor-pointer pt-2 border-t">
          <input
            type="checkbox"
            checked={!!logistics.room_block_secured_at}
            onChange={toggleSecured}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">Room block secured</span>
          {logistics.room_block_secured_at && (
            <span className="text-xs text-muted-foreground">
              ({new Date(logistics.room_block_secured_at).toLocaleDateString()})
            </span>
          )}
        </label>

        {!hotelName && !blockSize && (
          <p className="text-xs text-muted-foreground">
            Room block details are managed in the Room Blocks system. This card tracks logistics confirmation.
          </p>
        )}
      </div>
    </LogisticsCard>
  );
}

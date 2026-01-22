'use client';

import { Badge } from '@/dashboard-kit/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';
import type { TeachingHistoryRecord } from '@/lib/api/faculty-scheduler-queries';

interface InstructorHistoryPanelProps {
  history: TeachingHistoryRecord[];
  loading?: boolean;
}

function getStatusBadge(status: TeachingHistoryRecord['status']) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Completed</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Cancelled</Badge>;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function InstructorHistoryPanel({ history, loading }: InstructorHistoryPanelProps) {
  if (loading) {
    return (
      <div className="py-4 text-center text-muted-foreground text-sm">
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground text-sm">
        No teaching history recorded
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      {history.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between p-3 bg-background-card rounded-lg border border-border"
        >
          <div className="space-y-1">
            <div className="font-medium text-sm">{record.program_name}</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(record.start_date)}
              </span>
              {(record.city || record.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[record.city, record.state].filter(Boolean).join(', ')}
                </span>
              )}
              {record.block_count > 1 && (
                <span>{record.block_count} blocks</span>
              )}
            </div>
          </div>
          {getStatusBadge(record.status)}
        </div>
      ))}
    </div>
  );
}

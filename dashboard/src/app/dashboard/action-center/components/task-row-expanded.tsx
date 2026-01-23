'use client';

import { TaskExtended } from '@/lib/api/task-types';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { format } from 'date-fns';

interface TaskRowExpandedProps {
  task: TaskExtended;
}

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
};

const typeLabels = {
  standard: 'Standard',
  approval: 'Approval',
  decision: 'Decision',
  review: 'Review',
};

export function TaskRowExpanded({ task }: TaskRowExpandedProps) {
  return (
    <div className="px-6 py-4 bg-muted/30 border-t border-border space-y-4">
      {/* Status and Type badges */}
      <div className="flex gap-2">
        <Badge className={statusColors[task.status as keyof typeof statusColors] || statusColors.open}>
          {task.status?.replace('_', ' ').toUpperCase() || 'OPEN'}
        </Badge>
        <Badge variant="outline">
          {typeLabels[task.task_type as keyof typeof typeLabels] || 'Standard'}
        </Badge>
      </div>

      {/* Description */}
      {task.description && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
          <p className="text-sm">{task.description}</p>
        </div>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {task.created_at && (
          <div>
            <span className="text-muted-foreground">Created:</span>{' '}
            {format(new Date(task.created_at), 'MMM d, yyyy')}
          </div>
        )}
        {task.workflow_id && (
          <div>
            <span className="text-muted-foreground">Workflow:</span>{' '}
            <span className="text-accent-primary">View workflow</span>
          </div>
        )}
        {task.related_entity_type && (
          <div>
            <span className="text-muted-foreground">Related:</span>{' '}
            <span className="capitalize">{task.related_entity_type}</span>
          </div>
        )}
        {task.sop_template_id && (
          <div>
            <span className="text-muted-foreground">Has SOP:</span> Yes
          </div>
        )}
      </div>

      {/* Blocked by info */}
      {task.is_blocked && task.blocked_by_count > 0 && (
        <div className="p-3 bg-warning/10 rounded-lg">
          <span className="text-sm text-warning font-medium">
            Blocked by {task.blocked_by_count} task(s)
          </span>
        </div>
      )}

      {/* Action hint */}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        Full task detail and actions coming in Phase 5
      </div>
    </div>
  );
}

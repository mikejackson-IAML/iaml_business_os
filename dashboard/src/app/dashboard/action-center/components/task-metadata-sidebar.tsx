'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import {
  ExternalLink,
  Calendar,
  Building,
  Workflow,
  Link as LinkIcon,
  AlertCircle,
  Bot,
  User,
} from 'lucide-react';
import type { TaskExtended, TaskStatus } from '@/lib/api/task-types';
import { updateTaskStatusAction } from '../actions';
import { format } from 'date-fns';

interface TaskMetadataSidebarProps {
  task: TaskExtended;
}

// Status options for dropdown
const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
  { value: 'dismissed', label: 'Dismissed' },
];

// Reuse priority config from task-row
const priorityConfig = {
  critical: { color: 'bg-red-500', text: 'Critical' },
  high: { color: 'bg-orange-500', text: 'High' },
  normal: { color: 'bg-gray-400', text: 'Normal' },
  low: { color: 'bg-blue-500', text: 'Low' },
};

// Source icons
const sourceIcons = {
  alert: AlertCircle,
  workflow: Workflow,
  ai: Bot,
  manual: User,
  rule: Workflow,
};

export function TaskMetadataSidebar({ task }: TaskMetadataSidebarProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<TaskStatus>(task.status);

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    startTransition(async () => {
      const result = await updateTaskStatusAction(task.id, newStatus);
      if (!result.success) {
        // Revert on error
        setStatus(task.status);
        console.error('Failed to update status:', result.error);
      }
    });
  };

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal;
  const SourceIcon = sourceIcons[task.source as keyof typeof sourceIcons] || User;

  // Format due date
  const formatDueDate = () => {
    if (!task.due_date) return 'No due date';
    const dateStr = format(new Date(task.due_date), 'MMM d, yyyy');
    if (task.due_time) {
      return `${dateStr} at ${task.due_time}`;
    }
    return dateStr;
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Status - with dropdown (UI-12) */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority - display only with colored indicator */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Priority
          </label>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${priority.color}`} />
            <span className="text-sm">{priority.text}</span>
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Due Date
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDueDate()}</span>
          </div>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Department
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span>{task.department || 'Unassigned'}</span>
          </div>
        </div>

        {/* Task Type */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Task Type
          </label>
          <div className="text-sm capitalize">{task.task_type}</div>
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">
            Source
          </label>
          <div className="flex items-center gap-2 text-sm">
            <SourceIcon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{task.source || 'Manual'}</span>
          </div>
        </div>

        {/* Workflow (UI-16) - only if workflow_id exists */}
        {task.workflow_id && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Workflow
            </label>
            <Link
              href={`/dashboard/action-center/workflows/${task.workflow_id}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Workflow className="h-4 w-4" />
              <span>{task.workflow_name || 'View workflow'}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Related Entity (UI-15) - only if related_entity_type exists */}
        {task.related_entity_type && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Related Entity
            </label>
            {task.related_entity_url ? (
              <a
                href={task.related_entity_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="capitalize">{task.related_entity_type}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{task.related_entity_type}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

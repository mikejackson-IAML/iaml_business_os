'use client';

import { useState } from 'react';
import { Card } from '@/dashboard-kit/components/ui/card';
import { TaskExtended } from '@/lib/api/task-types';
import { TaskRow } from './task-row';
import { Button } from '@/dashboard-kit/components/ui/button';
import { FileQuestion, CheckCircle2 } from 'lucide-react';

interface TaskTableProps {
  tasks: TaskExtended[];
  isLoading?: boolean;
  emptyStateType: 'filter' | 'my-focus' | 'view';
  onClearFilters?: () => void;
  onViewAllTasks?: () => void;
}

export function TaskTable({
  tasks,
  isLoading,
  emptyStateType,
  onClearFilters,
  onViewAllTasks,
}: TaskTableProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleRowClick = (taskId: string) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  if (tasks.length === 0 && !isLoading) {
    return (
      <Card className="p-12">
        <EmptyState
          type={emptyStateType}
          onClearFilters={onClearFilters}
          onViewAllTasks={onViewAllTasks}
        />
      </Card>
    );
  }

  return (
    <Card>
      {/* Table Header */}
      <div className="grid grid-cols-[100px_1fr_120px_120px_100px] gap-4 px-6 py-3 border-b border-border text-sm text-muted-foreground font-medium">
        <div>Priority</div>
        <div>Task</div>
        <div>Due</div>
        <div>Department</div>
        <div>Source</div>
      </div>

      {/* Table Body */}
      <div>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isExpanded={expandedTaskId === task.id}
            onClick={() => handleRowClick(task.id)}
          />
        ))}
      </div>
    </Card>
  );
}

function EmptyState({
  type,
  onClearFilters,
  onViewAllTasks,
}: {
  type: 'filter' | 'my-focus' | 'view';
  onClearFilters?: () => void;
  onViewAllTasks?: () => void;
}) {
  if (type === 'my-focus') {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-4" />
        <h3 className="text-lg font-medium mb-2">All caught up!</h3>
        <p className="text-muted-foreground mb-4">
          No critical or high priority tasks due today.
        </p>
        {onViewAllTasks && (
          <Button variant="outline" onClick={onViewAllTasks}>
            Review upcoming tasks
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No tasks found</h3>
      <p className="text-muted-foreground mb-4">
        No tasks match your current filters.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}

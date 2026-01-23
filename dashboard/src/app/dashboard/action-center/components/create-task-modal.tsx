'use client';

import { useState, useTransition } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { createTaskAction } from '../actions';
import type { TaskType, TaskPriority } from '@/lib/api/task-types';

// Task type options
const taskTypes: { value: TaskType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'approval', label: 'Approval' },
  { value: 'decision', label: 'Decision' },
  { value: 'review', label: 'Review' },
];

// Priority options
const priorities: { value: TaskPriority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: string[];
}

export function CreateTaskModal({
  isOpen,
  onClose,
  departments,
}: CreateTaskModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('standard');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [department, setDepartment] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTaskType('standard');
    setPriority('normal');
    setDueDate('');
    setDepartment('');
    setError(null);
  };

  const handleSubmit = () => {
    // Validate title is not empty
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createTaskAction({
        title: title.trim(),
        description: description.trim() || undefined,
        task_type: taskType,
        priority,
        due_date: dueDate || undefined,
        department: department || undefined,
      });

      if (result.success) {
        resetForm();
        onClose();
      } else {
        setError(result.error || 'Failed to create task');
      }
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden bg-background flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <CardTitle>Create Task</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 overflow-y-auto flex-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Title (required) */}
            <div>
              <label
                htmlFor="task-title"
                className="text-sm font-medium mb-2 block"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="task-description"
                className="text-sm font-medium mb-2 block"
              >
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                rows={3}
                disabled={isPending}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Type and Priority (two-column grid) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="task-type"
                  className="text-sm font-medium mb-2 block"
                >
                  Type
                </label>
                <select
                  id="task-type"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {taskTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-priority"
                  className="text-sm font-medium mb-2 block"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date and Department (two-column grid) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="task-due-date"
                  className="text-sm font-medium mb-2 block"
                >
                  Due Date
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label
                  htmlFor="task-department"
                  className="text-sm font-medium mb-2 block"
                >
                  Department
                </label>
                <select
                  id="task-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">No department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </form>
        </CardContent>

        {/* Actions - fixed at bottom with border */}
        <div className="flex justify-end gap-2 p-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

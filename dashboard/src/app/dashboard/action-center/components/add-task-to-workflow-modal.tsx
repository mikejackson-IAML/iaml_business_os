'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Search, Loader2, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { addTaskToWorkflowAction } from '../workflow-actions';
import type { TaskExtended } from '@/lib/api/task-types';

// Priority dot colors matching task-row.tsx
const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-slate-400',
};

interface AddTaskToWorkflowModalProps {
  workflowId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * AddTaskToWorkflowModal - Select and add existing tasks to a workflow
 *
 * Features:
 * - Search input to filter available tasks
 * - Shows tasks not already in any workflow
 * - Click to select, highlight selected task
 * - Submit adds task to workflow
 */
export function AddTaskToWorkflowModal({
  workflowId,
  isOpen,
  onClose,
  onSuccess,
}: AddTaskToWorkflowModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Available tasks state
  const [availableTasks, setAvailableTasks] = useState<TaskExtended[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch available tasks when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchAvailableTasks = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        // Fetch tasks without a workflow assignment
        // Using the API route with no_workflow filter
        const response = await fetch('/api/tasks?no_workflow=true&limit=50');

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        setAvailableTasks(data.data || []);
      } catch (err) {
        console.error('Error fetching available tasks:', err);
        setFetchError('Failed to load available tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableTasks();
  }, [isOpen]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableTasks.slice(0, 10);
    }

    const query = searchQuery.toLowerCase();
    return availableTasks
      .filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.department?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [availableTasks, searchQuery]);

  // Handle task addition
  const handleAddTask = () => {
    if (!selectedTaskId) {
      setError('Please select a task to add');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addTaskToWorkflowAction(workflowId, selectedTaskId);

      if (result.success) {
        setSelectedTaskId(null);
        setSearchQuery('');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      } else {
        setError(result.error || 'Failed to add task to workflow');
      }
    });
  };

  // Handle close
  const handleClose = () => {
    setSelectedTaskId(null);
    setSearchQuery('');
    setError(null);
    onClose();
  };

  // Format due date
  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), 'MMM d');
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
      <Card className="relative w-full max-w-lg mx-4 bg-background max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <CardTitle>Add Task to Workflow</CardTitle>
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

        <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Search input */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] border border-border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center h-full py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : fetchError ? (
                <div className="p-4 text-center text-red-500 text-sm">
                  {fetchError}
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {searchQuery
                    ? 'No tasks match your search'
                    : 'No available tasks to add'}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredTasks.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`w-full px-3 py-2 text-left transition-colors hover:bg-muted/50 ${
                          selectedTaskId === task.id
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Priority dot */}
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                              priorityColors[task.priority] || priorityColors.normal
                            }`}
                          />

                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <p className="font-medium text-sm truncate">
                              {task.title}
                            </p>

                            {/* Metadata row */}
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDueDate(task.due_date)}
                                </span>
                              )}
                              {task.department && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {task.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex-shrink-0">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 flex-shrink-0">
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleAddTask}
                disabled={isPending || !selectedTaskId}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Task'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

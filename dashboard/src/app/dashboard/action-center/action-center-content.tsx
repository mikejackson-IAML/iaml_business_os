'use client';

import { useState, useMemo, useCallback } from 'react';
import { TaskExtended } from '@/lib/api/task-types';
import { ViewTabs, ViewPreset, viewPresetFilters } from './components/view-tabs';
import { TaskFilterToolbar, TaskFilters, emptyFilters } from './components/task-filters';
import { TaskTable } from './components/task-table';
import { CreateTaskModal } from './components/create-task-modal';
import { Button } from '@/dashboard-kit/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

interface ActionCenterContentProps {
  initialTasks: TaskExtended[];
  departments: string[];
}

export default function ActionCenterContent({
  initialTasks,
  departments,
}: ActionCenterContentProps) {
  const [tasks] = useState<TaskExtended[]>(initialTasks);
  const [activeView, setActiveView] = useState<ViewPreset>('my-focus');
  const [filters, setFilters] = useState<TaskFilters>(emptyFilters);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Apply view preset when tab changes
  const handleViewChange = useCallback((view: ViewPreset) => {
    setActiveView(view);
    // Reset manual filters when switching views
    setFilters(emptyFilters);
  }, []);

  // Combine view preset filters with manual filters
  const effectiveFilters = useMemo(() => {
    const preset = viewPresetFilters[activeView];
    return {
      status: filters.status.length > 0 ? filters.status : preset.status || [],
      priority: filters.priority.length > 0 ? filters.priority : preset.priority || [],
      due_category: filters.due_category.length > 0 ? filters.due_category : preset.due_category || [],
      department: filters.department,
      task_type: filters.task_type.length > 0 ? filters.task_type : preset.task_type || [],
      source: filters.source.length > 0 ? filters.source : preset.source || [],
      search: filters.search,
    };
  }, [activeView, filters]);

  // Client-side filtering
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (effectiveFilters.status.length > 0 && !effectiveFilters.status.includes(task.status || '')) {
        return false;
      }

      // Priority filter
      if (effectiveFilters.priority.length > 0 && !effectiveFilters.priority.includes(task.priority || '')) {
        return false;
      }

      // Due category filter
      if (effectiveFilters.due_category.length > 0) {
        const dueCategory = task.due_category || 'no_date';
        if (!effectiveFilters.due_category.includes(dueCategory)) {
          return false;
        }
      }

      // Department filter
      if (effectiveFilters.department.length > 0 && !effectiveFilters.department.includes(task.department || '')) {
        return false;
      }

      // Task type filter
      if (effectiveFilters.task_type.length > 0 && !effectiveFilters.task_type.includes(task.task_type || '')) {
        return false;
      }

      // Source filter
      if (effectiveFilters.source.length > 0 && !effectiveFilters.source.includes(task.source || '')) {
        return false;
      }

      // Search filter
      if (effectiveFilters.search) {
        const search = effectiveFilters.search.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(search);
        const matchesDescription = task.description?.toLowerCase().includes(search);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, effectiveFilters]);

  // Calculate counts for view tabs
  const viewCounts = useMemo(() => {
    const counts: Record<ViewPreset, number> = {
      'all': tasks.length,
      'my-focus': 0,
      'overdue': 0,
      'waiting': 0,
      'approvals': 0,
      'ai-suggested': 0,
    };

    tasks.forEach(task => {
      // My Focus: critical/high + today/overdue
      if (
        ['critical', 'high'].includes(task.priority || '') &&
        ['today', 'overdue'].includes(task.due_category || '') &&
        ['open', 'in_progress'].includes(task.status || '')
      ) {
        counts['my-focus']++;
      }

      // Overdue
      if (task.due_category === 'overdue' && ['open', 'in_progress', 'waiting'].includes(task.status || '')) {
        counts['overdue']++;
      }

      // Waiting
      if (task.status === 'waiting') {
        counts['waiting']++;
      }

      // Approvals
      if (task.task_type === 'approval' && ['open', 'in_progress'].includes(task.status || '')) {
        counts['approvals']++;
      }

      // AI Suggested
      if (task.source === 'ai' && task.status === 'open') {
        counts['ai-suggested']++;
      }
    });

    return counts;
  }, [tasks]);

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  const handleViewAllTasks = () => {
    setActiveView('all');
    setFilters(emptyFilters);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In a real implementation, this would re-fetch from the server
    // For now, just simulate a refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  // Determine empty state type
  const getEmptyStateType = (): 'filter' | 'my-focus' | 'view' => {
    if (activeView === 'my-focus' && filters.search === '' &&
        filters.status.length === 0 && filters.priority.length === 0) {
      return 'my-focus';
    }
    if (filters.search !== '' || Object.values(filters).some(v => Array.isArray(v) && v.length > 0)) {
      return 'filter';
    }
    return 'view';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Action Center</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <ViewTabs
        activeView={activeView}
        onViewChange={handleViewChange}
        taskCounts={viewCounts}
      />

      {/* Filter Toolbar */}
      <TaskFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      />

      {/* Task Table */}
      <TaskTable
        tasks={filteredTasks}
        emptyStateType={getEmptyStateType()}
        onClearFilters={handleClearFilters}
        onViewAllTasks={handleViewAllTasks}
      />

      {/* Task count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        departments={departments}
      />
    </div>
  );
}

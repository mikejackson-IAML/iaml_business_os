'use client';

import { Tabs, TabsList, TabsTrigger } from '@/dashboard-kit/components/ui/tabs';

export type ViewPreset = 'all' | 'my-focus' | 'overdue' | 'waiting' | 'approvals' | 'ai-suggested';

interface ViewTabsProps {
  activeView: ViewPreset;
  onViewChange: (view: ViewPreset) => void;
  taskCounts?: Record<ViewPreset, number>; // Optional badge counts
}

export const viewPresetFilters: Record<ViewPreset, {
  status?: string[];
  priority?: string[];
  due_category?: string[];
  task_type?: string[];
  source?: string[];
}> = {
  'all': {},
  'my-focus': {
    status: ['open', 'in_progress'],
    priority: ['critical', 'high'],
    due_category: ['today', 'overdue'],
  },
  'overdue': {
    due_category: ['overdue'],
    status: ['open', 'in_progress', 'waiting'],
  },
  'waiting': {
    status: ['waiting'],
  },
  'approvals': {
    task_type: ['approval'],
    status: ['open', 'in_progress'],
  },
  'ai-suggested': {
    source: ['ai'],
    status: ['open'],
  },
};

export function ViewTabs({ activeView, onViewChange, taskCounts }: ViewTabsProps) {
  const views: { value: ViewPreset; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'my-focus', label: 'My Focus' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'approvals', label: 'Approvals' },
    { value: 'ai-suggested', label: 'AI Suggested' },
  ];

  return (
    <Tabs value={activeView} onValueChange={(v) => onViewChange(v as ViewPreset)}>
      <TabsList>
        {views.map((view) => (
          <TabsTrigger key={view.value} value={view.value}>
            {view.label}
            {taskCounts && taskCounts[view.value] > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">
                {taskCounts[view.value]}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/dashboard-kit/components/ui/input';
import { Button } from '@/dashboard-kit/components/ui/button';
import { X, Search } from 'lucide-react';

export interface TaskFilters {
  status: string[];
  priority: string[];
  due_category: string[];
  department: string[];
  task_type: string[];
  source: string[];
  search: string;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  departments: string[]; // Available departments from data
}

const filterOptions = {
  status: [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'done', label: 'Done' },
    { value: 'dismissed', label: 'Dismissed' },
  ],
  priority: [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low' },
  ],
  due_category: [
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'later', label: 'Later' },
    { value: 'no_due_date', label: 'No Due Date' },
  ],
  task_type: [
    { value: 'standard', label: 'Standard' },
    { value: 'approval', label: 'Approval' },
    { value: 'decision', label: 'Decision' },
    { value: 'review', label: 'Review' },
  ],
  source: [
    { value: 'manual', label: 'Manual' },
    { value: 'alert', label: 'Alert' },
    { value: 'workflow', label: 'Workflow' },
    { value: 'ai', label: 'AI' },
  ],
};

export function TaskFilterToolbar({ filters, onFiltersChange, departments }: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // Debounce 300ms
    const timeout = setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof Omit<TaskFilters, 'search'>, value: string) => {
    const current = filters[key];
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: newValues });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({
      status: [],
      priority: [],
      due_category: [],
      department: [],
      task_type: [],
      source: [],
      search: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return value !== '';
    return Array.isArray(value) && value.length > 0;
  });

  const activeChips = Object.entries(filters).flatMap(([key, values]) => {
    if (key === 'search') return [];
    return (values as string[]).map(v => ({
      key,
      value: v,
      label: filterOptions[key as keyof typeof filterOptions]?.find(o => o.value === v)?.label || v,
    }));
  });

  return (
    <div className="space-y-3">
      {/* Filter dropdowns row */}
      <div className="flex flex-wrap gap-3">
        {/* Status */}
        <FilterDropdown
          label="Status"
          options={filterOptions.status}
          selected={filters.status}
          onChange={(v) => handleFilterChange('status', v)}
        />

        {/* Priority */}
        <FilterDropdown
          label="Priority"
          options={filterOptions.priority}
          selected={filters.priority}
          onChange={(v) => handleFilterChange('priority', v)}
        />

        {/* Due Date */}
        <FilterDropdown
          label="Due"
          options={filterOptions.due_category}
          selected={filters.due_category}
          onChange={(v) => handleFilterChange('due_category', v)}
        />

        {/* Department */}
        <FilterDropdown
          label="Department"
          options={departments.map(d => ({ value: d, label: d }))}
          selected={filters.department}
          onChange={(v) => handleFilterChange('department', v)}
        />

        {/* Type */}
        <FilterDropdown
          label="Type"
          options={filterOptions.task_type}
          selected={filters.task_type}
          onChange={(v) => handleFilterChange('task_type', v)}
        />

        {/* Source */}
        <FilterDropdown
          label="Source"
          options={filterOptions.source}
          selected={filters.source}
          onChange={(v) => handleFilterChange('source', v)}
        />

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          {activeChips.map((chip) => (
            <span
              key={`${chip.key}-${chip.value}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-accent-primary/10 text-accent-primary"
            >
              {chip.label}
              <button
                onClick={() => handleFilterChange(chip.key as keyof Omit<TaskFilters, 'search'>, chip.value)}
                className="hover:bg-accent-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-accent-primary/10 text-accent-primary">
              Search: "{filters.search}"
              <button
                onClick={() => {
                  setSearchInput('');
                  onFiltersChange({ ...filters, search: '' });
                }}
                className="hover:bg-accent-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

// Internal dropdown component
function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 border rounded-lg text-sm flex items-center gap-2 ${
          selected.length > 0
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border bg-background'
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs rounded-full bg-accent-primary text-white">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <span className={`w-4 h-4 border rounded flex items-center justify-center ${
                  selected.includes(option.value) ? 'bg-accent-primary border-accent-primary' : 'border-border'
                }`}>
                  {selected.includes(option.value) && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export const emptyFilters: TaskFilters = {
  status: [],
  priority: [],
  due_category: [],
  department: [],
  task_type: [],
  source: [],
  search: '',
};

'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/dashboard-kit/components/ui/input';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { ProjectStatus, PhaseType } from '@/dashboard-kit/types/departments/planning';
import { getStatusLabel, getPhaseLabel } from '@/dashboard-kit/types/departments/planning';

const NON_ARCHIVED_STATUSES: ProjectStatus[] = [
  'idea',
  'planning',
  'ready_to_build',
  'building',
  'shipped',
];

const ALL_PHASES: PhaseType[] = [
  'capture',
  'discover',
  'define',
  'develop',
  'validate',
  'package',
];

interface PipelineSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ProjectStatus | 'all';
  onStatusFilterChange: (status: ProjectStatus | 'all') => void;
  phaseFilter: PhaseType | 'all';
  onPhaseFilterChange: (phase: PhaseType | 'all') => void;
}

export function PipelineSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  phaseFilter,
  onPhaseFilterChange,
}: PipelineSearchFilterProps) {
  const hasActiveFilters =
    searchQuery !== '' || statusFilter !== 'all' || phaseFilter !== 'all';

  const handleClear = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onPhaseFilterChange('all');
  };

  return (
    <div className="flex items-center gap-3 flex-wrap mb-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 w-64"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) =>
          onStatusFilterChange(e.target.value as ProjectStatus | 'all')
        }
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="all">All Statuses</option>
        {NON_ARCHIVED_STATUSES.map((status) => (
          <option key={status} value={status}>
            {getStatusLabel(status)}
          </option>
        ))}
      </select>

      {/* Phase filter */}
      <select
        value={phaseFilter}
        onChange={(e) =>
          onPhaseFilterChange(e.target.value as PhaseType | 'all')
        }
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="all">All Phases</option>
        {ALL_PHASES.map((phase) => (
          <option key={phase} value={phase}>
            {getPhaseLabel(phase)}
          </option>
        ))}
      </select>

      {/* Clear button */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

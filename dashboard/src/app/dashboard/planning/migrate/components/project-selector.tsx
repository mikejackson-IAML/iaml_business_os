'use client';

import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { OldProject } from '../actions';

interface ProjectSelectorProps {
  projects: OldProject[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'idle':
      return 'bg-slate-500/20 text-slate-400';
    case 'executing':
      return 'bg-blue-500/20 text-blue-400';
    case 'needs_input':
      return 'bg-amber-500/20 text-amber-400';
    case 'blocked':
      return 'bg-red-500/20 text-red-400';
    case 'complete':
      return 'bg-emerald-500/20 text-emerald-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
}

function truncateDescription(desc: string | null, maxLength = 80): string {
  if (!desc) return '';
  if (desc.length <= maxLength) return desc;
  return desc.slice(0, maxLength) + '...';
}

export function ProjectSelector({
  projects,
  selected,
  onSelectionChange,
}: ProjectSelectorProps) {
  const handleToggle = (projectId: string) => {
    if (selected.includes(projectId)) {
      onSelectionChange(selected.filter((id) => id !== projectId));
    } else {
      onSelectionChange([...selected, projectId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(projects.map((p) => p.id));
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No projects found in the old Development Dashboard.</p>
        <p className="text-sm mt-2">Nothing to migrate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selected.length} of {projects.length} selected
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selected.length === projects.length}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            disabled={selected.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Project list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {projects.map((project) => {
          const isSelected = selected.includes(project.id);
          const isComplete = project.status === 'complete';

          return (
            <button
              key={project.id}
              type="button"
              data-testid="old-project-item"
              onClick={() => handleToggle(project.id)}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-colors text-left ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              } ${isComplete ? 'opacity-75' : ''}`}
            >
              <div className="pt-0.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(project.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">
                    {project.project_name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(project.status)}`}
                  >
                    {project.status}
                  </span>
                  {isComplete && (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {truncateDescription(project.description)}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Key: {project.project_key}</span>
                  <span>Created: {formatDate(project.created_at)}</span>
                  {project.completed_at && (
                    <span>Completed: {formatDate(project.completed_at)}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

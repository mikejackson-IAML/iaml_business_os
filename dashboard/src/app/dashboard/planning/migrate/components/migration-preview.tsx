'use client';

import type { OldProject } from '../actions';

interface MigrationPreviewProps {
  projects: OldProject[];
}

/**
 * Status mapping display for preview
 */
function getNewStatus(oldStatus: string): { status: string; phase: string } {
  const map: Record<string, { status: string; phase: string }> = {
    'idle': { status: 'Idea', phase: 'Capture' },
    'executing': { status: 'Planning', phase: 'Discover' },
    'needs_input': { status: 'Planning', phase: 'Discover' },
    'blocked': { status: 'Planning', phase: 'Discover' },
    'complete': { status: 'Shipped', phase: 'Package' },
  };
  return map[oldStatus] || { status: 'Idea', phase: 'Capture' };
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'idea':
      return 'bg-purple-500/20 text-purple-400';
    case 'planning':
      return 'bg-blue-500/20 text-blue-400';
    case 'shipped':
      return 'bg-emerald-500/20 text-emerald-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
}

export function MigrationPreview({ projects }: MigrationPreviewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No projects selected for migration.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-sm text-blue-400">
          <strong>{projects.length}</strong> project{projects.length !== 1 ? 's' : ''} will be migrated to Planning Studio
        </p>
      </div>

      {/* Preview table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 font-medium">Old Project</th>
              <th className="text-left p-3 font-medium">Old Status</th>
              <th className="text-center p-3 font-medium">
                <span className="text-muted-foreground">-&gt;</span>
              </th>
              <th className="text-left p-3 font-medium">New Status</th>
              <th className="text-left p-3 font-medium">Phase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects.map((project) => {
              const newMapping = getNewStatus(project.status);
              return (
                <tr key={project.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <span className="font-medium">{project.project_name}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-muted-foreground">{project.status}</span>
                  </td>
                  <td className="p-3 text-center text-muted-foreground">
                    -&gt;
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(newMapping.status)}`}>
                      {newMapping.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-muted-foreground">{newMapping.phase}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Notes:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Project titles and descriptions will be preserved</li>
          <li>Creation dates will be preserved</li>
          <li>Completed projects will have their shipped date set</li>
          <li>Original dev_projects data will not be deleted</li>
        </ul>
      </div>
    </div>
  );
}

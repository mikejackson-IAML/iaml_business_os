'use client';

import { useState } from 'react';
import { Check, Circle, Loader2, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Button } from '@/dashboard-kit/components/ui/button';
import type {
  DevProjectSummary,
  DevProjectPhase,
  PhaseStatus,
} from '@/dashboard-kit/types/departments/development';

interface RoadmapViewProps {
  projects: DevProjectSummary[];
  phases: Record<string, DevProjectPhase[]>;
}

function getPhaseIcon(status: PhaseStatus, isCurrent: boolean) {
  if (status === 'complete') {
    return <Check className="h-3 w-3" />;
  }
  if (status === 'in_progress' || isCurrent) {
    return <Loader2 className="h-3 w-3 animate-spin" />;
  }
  if (status === 'blocked') {
    return <AlertCircle className="h-3 w-3" />;
  }
  return <Circle className="h-3 w-3" />;
}

function getPhaseColorClass(status: PhaseStatus, isCurrent: boolean): string {
  if (status === 'complete') {
    return 'bg-green-500 text-white border-green-500';
  }
  if (status === 'in_progress' || isCurrent) {
    return 'bg-blue-500 text-white border-blue-500';
  }
  if (status === 'blocked') {
    return 'bg-red-500 text-white border-red-500';
  }
  return 'bg-muted text-muted-foreground border-border';
}

export function RoadmapView({ projects, phases }: RoadmapViewProps) {
  const [selectedPhase, setSelectedPhase] = useState<DevProjectPhase | null>(null);

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No projects to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((project) => {
        const projectPhases = phases[project.project_key] || [];

        return (
          <Card key={project.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{project.project_name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {project.current_milestone}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {project.completed_phases} / {project.total_phases} phases complete
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {projectPhases.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No phase data synced yet. Run a GSD command to populate.
                </p>
              ) : (
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {projectPhases.map((phase) => {
                    const isCurrent = phase.phase_number === project.current_phase + 1;

                    return (
                      <button
                        key={phase.id}
                        onClick={() => setSelectedPhase(phase)}
                        className={`
                          flex items-center justify-center
                          min-w-[40px] h-10 px-3
                          rounded-md border-2 transition-all
                          hover:scale-105 cursor-pointer
                          ${getPhaseColorClass(phase.status, isCurrent)}
                        `}
                        title={`Phase ${phase.phase_number}: ${phase.phase_name}`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {getPhaseIcon(phase.status, isCurrent)}
                          {phase.phase_number}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Phase labels */}
              {projectPhases.length > 0 && (
                <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                  {projectPhases.map((phase) => (
                    <div
                      key={phase.id}
                      className="min-w-[40px] text-center"
                    >
                      <span className="text-[10px] text-muted-foreground truncate block px-1">
                        {phase.phase_name.length > 8
                          ? phase.phase_name.substring(0, 6) + '...'
                          : phase.phase_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Phase Detail Modal */}
      {selectedPhase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSelectedPhase(null)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>
                  Phase {selectedPhase.phase_number}: {selectedPhase.phase_name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPhase(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedPhase.goal || 'No goal specified'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <Badge variant="outline" className="capitalize">
                  {selectedPhase.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Progress */}
              {selectedPhase.plan_count > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPhase.plans_complete} / {selectedPhase.plan_count} plans complete
                  </p>
                </div>
              )}

              {/* Requirements */}
              {selectedPhase.requirements && selectedPhase.requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPhase.requirements.map((req) => (
                      <Badge key={req} variant="secondary" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Criteria */}
              {selectedPhase.success_criteria && selectedPhase.success_criteria.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Success Criteria</h4>
                  <ul className="space-y-1">
                    {selectedPhase.success_criteria.map((criterion, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Circle className="h-2 w-2 mt-2 flex-shrink-0" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

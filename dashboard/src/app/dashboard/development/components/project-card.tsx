'use client';

import { Play, AlertCircle, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { DevProjectSummary, ProjectStatus } from '@/dashboard-kit/types/departments/development';
import { getStatusLabel, getLaunchCommand } from '@/dashboard-kit/types/departments/development';

interface ProjectCardProps {
  project: DevProjectSummary;
  onLaunch?: () => void;
}

function getStatusIcon(status: ProjectStatus) {
  switch (status) {
    case 'idle':
      return <Play className="h-4 w-4" />;
    case 'executing':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'needs_input':
      return <AlertCircle className="h-4 w-4" />;
    case 'blocked':
      return <XCircle className="h-4 w-4" />;
    case 'complete':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function getStatusVariant(status: ProjectStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'idle':
      return 'default';
    case 'executing':
      return 'secondary';
    case 'needs_input':
      return 'outline';
    case 'blocked':
      return 'destructive';
    case 'complete':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getStatusColorClass(status: ProjectStatus): string {
  switch (status) {
    case 'idle':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'executing':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'needs_input':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'blocked':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    case 'complete':
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
  }
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function ProjectCard({ project, onLaunch }: ProjectCardProps) {
  const progress = project.total_phases > 0
    ? Math.round((project.completed_phases / project.total_phases) * 100)
    : 0;

  const canLaunch = getLaunchCommand(project) !== null;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{project.project_name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {project.current_milestone}
            </Badge>
          </div>
          <Badge className={`flex items-center gap-1.5 ${getStatusColorClass(project.status)}`}>
            {getStatusIcon(project.status)}
            {getStatusLabel(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Phase {project.current_phase} / {project.total_phases}
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Last Activity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {project.last_activity_description || 'No activity yet'}
          </span>
          <span className="text-muted-foreground">
            {formatTimeAgo(project.last_activity_at)}
          </span>
        </div>

        {/* Pending Decisions */}
        {project.pending_decision_count > 0 && (
          <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <span>{project.pending_decision_count} decision{project.pending_decision_count > 1 ? 's' : ''} pending</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {canLaunch && (
            <Button onClick={onLaunch} size="sm">
              {project.status === 'needs_input' ? 'Handle' : 'Launch'}
              <Play className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

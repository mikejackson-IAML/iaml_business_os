import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import {
  getPlanningProject,
  getProjectPhases,
  getProjectConversations,
  getProjectDocuments,
  getProjectResearch,
} from '@/lib/api/planning-queries';
import { getStatusLabel } from '@/dashboard-kit/types/departments/planning';
import { PhaseProgressBar } from './components/phase-progress-bar';

interface ProjectContentProps {
  projectId: string;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'healthy' | 'warning' | 'info' | 'outline' {
  switch (status) {
    case 'idea':
      return 'secondary';
    case 'planning':
      return 'warning';
    case 'ready_to_build':
      return 'healthy';
    case 'building':
      return 'info';
    case 'shipped':
      return 'healthy';
    case 'archived':
      return 'outline';
    default:
      return 'default';
  }
}

export async function ProjectContent({ projectId }: ProjectContentProps) {
  const [project, phases, conversations, documents, research] = await Promise.all([
    getPlanningProject(projectId),
    getProjectPhases(projectId),
    getProjectConversations(projectId),
    getProjectDocuments(projectId),
    getProjectResearch(projectId),
  ]);

  if (!project) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Pipeline</span>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Project not found</h3>
            <p className="text-muted-foreground">
              This project may have been archived or deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header>
        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Pipeline</span>
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
          <Badge variant={getStatusBadgeVariant(project.status)}>
            {getStatusLabel(project.status)}
          </Badge>
        </div>
        {project.one_liner && (
          <p className="text-muted-foreground text-sm">{project.one_liner}</p>
        )}
      </header>

      {/* Phase Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <PhaseProgressBar
            phases={phases}
            currentPhase={project.current_phase}
            project={project}
          />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Sessions</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {conversations.length} session{conversations.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Documents</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium">Research</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {research.length} research run{research.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Conversation Area */}
        <div className="lg:col-span-3">
          <Card className="h-full min-h-[500px]">
            <CardHeader className="pb-2 border-b">
              <h3 className="text-sm font-medium">Conversation</h3>
            </CardHeader>
            <CardContent className="pt-4 flex items-center justify-center h-[450px]">
              <p className="text-muted-foreground text-sm">
                Conversation area coming in Plan 03
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

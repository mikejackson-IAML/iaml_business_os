'use client';

import { useState } from 'react';
import {
  FolderCode,
  GitBranch,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard-kit/components/ui/tabs';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProjectCard } from './components/project-card';
import { RoadmapView } from './components/roadmap-view';
import { IdeasBacklog } from './components/ideas-backlog';
import { LaunchModal } from './components/launch-modal';
import type { DevelopmentDashboardData, DevProjectSummary } from '@/dashboard-kit/types/departments/development';
import { getLaunchCommand } from '@/dashboard-kit/types/departments/development';

interface DevelopmentContentProps {
  data: DevelopmentDashboardData;
}

export function DevelopmentContent({ data }: DevelopmentContentProps) {
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DevProjectSummary | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<string>('');

  const handleLaunch = (project: DevProjectSummary) => {
    const command = getLaunchCommand(project);
    if (command) {
      setSelectedProject(project);
      setSelectedCommand(command);
      setLaunchModalOpen(true);
    }
  };

  const handleLaunchAll = () => {
    const commands = data.projectsNeedingAttention
      .filter(p => p.suggested_command)
      .map(p => p.suggested_command as string);

    if (commands.length > 0) {
      setSelectedProject(null);
      setSelectedCommand(commands.join('\n'));
      setLaunchModalOpen(true);
    }
  };

  const readyProjects = data.projects.filter(p => p.status === 'idle' && p.current_phase < p.total_phases);

  return (
    <div className="relative min-h-screen">
      {/* Background pattern */}
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="badge-live">DEV</span>
              <h1 className="text-display-sm text-foreground">Development</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground">
            Parallel project management - Track progress, roadmaps, and ideas
          </p>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-sm font-medium">CEO Dashboard</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            {readyProjects.length > 0 && (
              <button
                onClick={handleLaunchAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
              >
                <span className="text-sm font-medium">
                  Launch All Ready ({readyProjects.length})
                </span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Active Projects"
            value={data.stats.activeProjects}
            icon={FolderCode}
            format="number"
          />
          <MetricCard
            label="Needs Input"
            value={data.stats.projectsNeedingInput}
            icon={AlertCircle}
            format="number"
            status={data.stats.projectsNeedingInput > 0 ? 'warning' : 'healthy'}
          />
          <MetricCard
            label="Blocked"
            value={data.stats.blockedProjects}
            icon={Clock}
            format="number"
            status={data.stats.blockedProjects > 0 ? 'critical' : 'healthy'}
          />
          <MetricCard
            label="Ideas Backlog"
            value={data.stats.totalIdeas}
            icon={Lightbulb}
            format="number"
          />
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderCode className="h-4 w-4" />
              Active Projects
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Roadmap
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Ideas
            </TabsTrigger>
          </TabsList>

          {/* Active Projects View */}
          <TabsContent value="projects" className="space-y-4">
            {data.projects.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                  <p className="text-muted-foreground">
                    Run <code className="text-sm bg-muted px-2 py-1 rounded">/gsd:new-project</code> to create your first project.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data.projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onLaunch={() => handleLaunch(project)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Roadmap View */}
          <TabsContent value="roadmap">
            <RoadmapView projects={data.projects} phases={data.phases} />
          </TabsContent>

          {/* Ideas Backlog */}
          <TabsContent value="ideas">
            <IdeasBacklog projects={data.projects} ideas={data.ideas} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Launch Modal */}
      <LaunchModal
        open={launchModalOpen}
        onOpenChange={setLaunchModalOpen}
        project={selectedProject}
        command={selectedCommand}
      />
    </div>
  );
}

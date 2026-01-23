'use client';

import { useState } from 'react';
import { Plus, Lightbulb, Edit, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Button } from '@/dashboard-kit/components/ui/button';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Input } from '@/dashboard-kit/components/ui/input';
import type {
  DevProjectSummary,
  DevProjectIdea,
} from '@/dashboard-kit/types/departments/development';

interface IdeasBacklogProps {
  projects: DevProjectSummary[];
  ideas: Record<string, DevProjectIdea[]>;
}

const MILESTONE_OPTIONS = ['v1.1', 'v1.2', 'v2.0', 'v2.1', 'v3.0', 'backlog'];

export function IdeasBacklog({ projects, ideas }: IdeasBacklogProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_milestone: '',
  });

  const handleAddIdea = async () => {
    // In a real implementation, this would call an API to create the idea
    console.log('Creating idea:', { ...formData, project_id: selectedProjectId });
    setAddModalOpen(false);
    setFormData({ title: '', description: '', target_milestone: '' });
    setSelectedProjectId('');
    // Would refresh data here
  };

  const totalIdeas = Object.values(ideas).flat().length;

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Ideas Backlog</h2>
          <p className="text-sm text-muted-foreground">
            {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''} captured
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Idea
        </Button>
      </div>

      {/* Ideas grouped by project */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground">
              Create a project first to start capturing ideas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const projectIdeas = ideas[project.project_key] || [];

            return (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {project.project_name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {projectIdeas.length} idea{projectIdeas.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {projectIdeas.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No ideas captured yet for this project.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {projectIdeas.map((idea) => (
                        <li
                          key={idea.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">
                                {idea.title}
                              </h4>
                              {idea.target_milestone && (
                                <Badge variant="outline" className="text-xs">
                                  {idea.target_milestone}
                                </Badge>
                              )}
                            </div>
                            {idea.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {idea.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Idea Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setAddModalOpen(false)}
          />
          <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Add New Idea</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAddModalOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Capture an idea for future development.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Add dark mode toggle"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the idea in more detail..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                />
              </div>

              {/* Target Milestone */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Milestone</label>
                <select
                  value={formData.target_milestone}
                  onChange={(e) => setFormData({ ...formData, target_milestone: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select target milestone</option>
                  {MILESTONE_OPTIONS.map((milestone) => (
                    <option key={milestone} value={milestone}>
                      {milestone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddIdea}
                  disabled={!selectedProjectId || !formData.title}
                >
                  Add Idea
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

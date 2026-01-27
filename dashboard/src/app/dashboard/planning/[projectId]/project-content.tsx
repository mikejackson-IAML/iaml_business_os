'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';

interface ProjectContentProps {
  projectId: string;
}

export function ProjectContent({ projectId }: ProjectContentProps) {
  return (
    <div className="p-6 lg:p-8">
      {/* Header with back button */}
      <header className="mb-8">
        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Pipeline</span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="badge-live">PROJECT</span>
          <h1 className="text-display-sm text-foreground">Project Detail</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          ID: <code className="text-xs bg-muted px-2 py-1 rounded">{projectId}</code>
        </p>
      </header>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Project view coming soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Manage conversations, documents, and research for your idea.
            Track progress through phases and collaborate with AI planning assistants.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

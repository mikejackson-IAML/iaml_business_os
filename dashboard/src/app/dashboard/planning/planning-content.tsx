'use client';

import { Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';

export function PlanningContent() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="badge-live">PLAN</span>
          <h1 className="text-display-sm text-foreground">Planning Studio</h1>
        </div>
        <p className="text-muted-foreground">
          AI-guided idea-to-production pipeline
        </p>
      </header>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Planning Studio coming soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect the dots from idea to shipped product. Capture ideas, have AI-guided
            planning conversations, and track progress through the pipeline.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

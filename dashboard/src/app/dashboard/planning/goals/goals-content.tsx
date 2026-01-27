'use client';

import Link from 'next/link';
import { ArrowLeft, Target } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';

export function GoalsContent() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Pipeline</span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="badge-live">GOALS</span>
          <h1 className="text-display-sm text-foreground">Goals Management</h1>
        </div>
        <p className="text-muted-foreground">
          Set priorities to help AI rank your projects
        </p>
      </header>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Goals management coming soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Set your priorities to help AI rank your projects. Define what matters most
            and the system will help you focus on high-impact work.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

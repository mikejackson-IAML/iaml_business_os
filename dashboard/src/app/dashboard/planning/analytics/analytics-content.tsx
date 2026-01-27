'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';

export function AnalyticsContent() {
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
          <span className="badge-live">ANALYTICS</span>
          <h1 className="text-display-sm text-foreground">Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Track your idea-to-shipped pipeline metrics
        </p>
      </header>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Analytics coming soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Track your idea-to-shipped pipeline. See conversion rates, cycle times,
            and identify bottlenecks in your planning process.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

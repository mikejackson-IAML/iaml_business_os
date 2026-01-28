'use client';

import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';

export function EmptyAnalytics() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-6">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium mb-2">No analytics data yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ship some projects to see your pipeline metrics here. Analytics will show
            conversion rates, velocity, and trends once you have activity.
          </p>
        </div>

        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View Pipeline
        </Link>
      </CardContent>
    </Card>
  );
}

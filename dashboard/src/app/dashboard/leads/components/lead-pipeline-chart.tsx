'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { LeadPipeline } from '@/dashboard-kit/types/departments/lead-intelligence';

interface LeadPipelineChartProps {
  imports: LeadPipeline[];
  className?: string;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function LeadPipelineChart({ imports, className }: LeadPipelineChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Recent Lead Imports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {imports.map((imp) => (
            <div
              key={imp.id}
              className="p-4 rounded-lg border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">{imp.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(imp.importedAt)}
                  </p>
                </div>
                <Badge variant={imp.validationRate >= 90 ? 'default' : 'secondary'}>
                  {imp.validationRate.toFixed(0)}% valid
                </Badge>
              </div>

              {/* Pipeline visualization */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Sourced</span>
                    <span>{imp.leadsSourced.toLocaleString()}</span>
                  </div>
                  <Progress value={100} className="h-1.5" />
                </div>
                <span className="text-muted-foreground px-1">&rarr;</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Validated</span>
                    <span>{imp.leadsValidated.toLocaleString()}</span>
                  </div>
                  <Progress
                    value={imp.leadsSourced > 0 ? (imp.leadsValidated / imp.leadsSourced) * 100 : 0}
                    className="h-1.5"
                  />
                </div>
                <span className="text-muted-foreground px-1">&rarr;</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Ready</span>
                    <span>{imp.leadsReady.toLocaleString()}</span>
                  </div>
                  <Progress
                    value={imp.leadsSourced > 0 ? (imp.leadsReady / imp.leadsSourced) * 100 : 0}
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          ))}

          {imports.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No recent imports
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

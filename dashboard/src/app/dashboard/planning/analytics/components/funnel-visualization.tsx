'use client';

import { BarList } from '@tremor/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/dashboard-kit/components/ui/card';

interface FunnelVisualizationProps {
  data: Array<{ name: string; value: number }>;
  className?: string;
}

export function FunnelVisualization({
  data,
  className,
}: FunnelVisualizationProps) {
  // Calculate conversion rate (first stage to shipped)
  const firstStageCount = data.length > 0 ? data[0].value : 0;
  const shippedCount = data.find((d) => d.name === 'Shipped')?.value || 0;
  const conversionRate =
    firstStageCount > 0
      ? Math.round((shippedCount / firstStageCount) * 100)
      : 0;

  // Format value for display
  const valueFormatter = (value: number) =>
    `${value} project${value === 1 ? '' : 's'}`;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Pipeline Funnel</CardTitle>
        <p className="text-sm text-muted-foreground">
          {conversionRate}% make it to shipped
        </p>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <BarList
            data={data}
            valueFormatter={valueFormatter}
            color="blue"
            className="mt-2"
          />
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No projects yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

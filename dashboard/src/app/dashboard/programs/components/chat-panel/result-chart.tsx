'use client';

import { BarChart } from '@tremor/react';

interface ChartConfig {
  type: 'bar';
  xKey: string;
  yKey: string;
  title?: string;
}

interface ResultChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

export function ResultChart({ data, config }: ResultChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data to display.</p>;
  }

  // Format value for display (currency, numbers)
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return value.toLocaleString();
  };

  // Transform data for Tremor BarChart
  const chartData = data.map(item => ({
    name: String(item[config.xKey] || 'Unknown'),
    value: Number(item[config.yKey] || 0),
  }));

  return (
    <div className="mt-3 rounded-lg border bg-card p-4">
      {config.title && (
        <h4 className="text-sm font-medium mb-3">{config.title}</h4>
      )}
      <BarChart
        data={chartData}
        index="name"
        categories={['value']}
        colors={['blue']}
        valueFormatter={formatValue}
        className="h-52"
        showLegend={false}
        showGridLines={false}
      />
    </div>
  );
}

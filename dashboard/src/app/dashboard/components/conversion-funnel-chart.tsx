'use client';

import { Card, Title, Text, BarChart } from '@tremor/react';

interface ConversionFunnelChartProps {
  totalContacts: number;
  engagedContacts: number;
  registeredContacts: number;
}

export function ConversionFunnelChart({
  totalContacts,
  engagedContacts,
  registeredContacts,
}: ConversionFunnelChartProps) {
  const chartData = [
    {
      stage: 'Total Contacts',
      count: totalContacts,
    },
    {
      stage: 'Engaged',
      count: engagedContacts,
    },
    {
      stage: 'Registered',
      count: registeredContacts,
    },
  ];

  const engagementRate = totalContacts > 0
    ? ((engagedContacts / totalContacts) * 100).toFixed(1)
    : '0';
  const conversionRate = totalContacts > 0
    ? ((registeredContacts / totalContacts) * 100).toFixed(1)
    : '0';

  return (
    <Card className="bg-background-card border-border">
      <Title className="text-foreground">Conversion Funnel</Title>
      <Text className="text-muted-foreground">
        {engagementRate}% engaged, {conversionRate}% converted
      </Text>
      <BarChart
        className="mt-4 h-72"
        data={chartData}
        index="stage"
        categories={['count']}
        colors={['cyan']}
        valueFormatter={(value) => value.toLocaleString()}
        yAxisWidth={48}
        showLegend={false}
      />
    </Card>
  );
}

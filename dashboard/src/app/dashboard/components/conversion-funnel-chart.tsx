'use client';

import { Card, Title, Text, BarList } from '@tremor/react';

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
      name: 'Total Contacts',
      value: totalContacts,
      color: 'bg-cyan-500',
    },
    {
      name: 'Engaged',
      value: engagedContacts,
      color: 'bg-blue-500',
    },
    {
      name: 'Registered',
      value: registeredContacts,
      color: 'bg-emerald-500',
    },
  ];

  const engagementRate = totalContacts > 0
    ? ((engagedContacts / totalContacts) * 100).toFixed(1)
    : '0';
  const conversionRate = totalContacts > 0
    ? ((registeredContacts / totalContacts) * 100).toFixed(1)
    : '0';

  return (
    <Card className="!bg-white/5 !border-white/10 backdrop-blur-sm !ring-0">
      <Title className="!text-white">Conversion Funnel</Title>
      <Text className="!text-white/60">
        {engagementRate}% engaged, {conversionRate}% converted
      </Text>
      <BarList
        data={chartData}
        className="mt-4"
        valueFormatter={(value: number) => value.toLocaleString()}
        color="cyan"
      />
    </Card>
  );
}

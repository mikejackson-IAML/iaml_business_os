'use client';

import { Card, Title, Text, DonutChart } from '@tremor/react';
import type { ChannelPerformance } from '@/lib/supabase/types';

interface ChannelPerformanceChartProps {
  channels: ChannelPerformance[];
}

export function ChannelPerformanceChart({ channels }: ChannelPerformanceChartProps) {
  const chartData = channels.map((channel) => ({
    name: capitalizeFirst(channel.channel || 'Unknown'),
    value: channel.total_contacts || 0,
    replied: channel.replied || 0,
  }));

  const totalReplies = channels.reduce((sum, ch) => sum + (ch.replied || 0), 0);
  const totalContacts = channels.reduce((sum, ch) => sum + (ch.total_contacts || 0), 0);

  if (chartData.length === 0) {
    return (
      <Card className="bg-background-card border-border">
        <Title className="text-foreground">Channel Distribution</Title>
        <Text className="text-muted-foreground">No channel data available</Text>
      </Card>
    );
  }

  return (
    <Card className="bg-background-card border-border">
      <Title className="text-foreground">Channel Distribution</Title>
      <Text className="text-muted-foreground">
        {totalContacts.toLocaleString()} contacts across {channels.length} channels
      </Text>
      <DonutChart
        className="mt-4 h-52"
        data={chartData}
        category="value"
        index="name"
        colors={['cyan', 'blue', 'indigo', 'violet']}
        valueFormatter={(value) => value.toLocaleString()}
        showLabel
        showAnimation
      />
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">{totalReplies}</p>
          <p className="text-muted-foreground">Total Replies</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">
            {totalContacts > 0 ? ((totalReplies / totalContacts) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-muted-foreground">Reply Rate</p>
        </div>
      </div>
    </Card>
  );
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

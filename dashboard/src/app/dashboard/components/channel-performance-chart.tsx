'use client';

import { Card, Title, Text, BarList } from '@tremor/react';
import type { ChannelPerformance } from '@/lib/supabase/types';

interface ChannelPerformanceChartProps {
  channels: ChannelPerformance[];
}

export function ChannelPerformanceChart({ channels }: ChannelPerformanceChartProps) {
  const chartData = channels.map((channel) => ({
    name: capitalizeFirst(channel.channel || 'Unknown'),
    value: channel.total_contacts || 0,
  }));

  const totalReplies = channels.reduce((sum, ch) => sum + (ch.replied || 0), 0);
  const totalContacts = channels.reduce((sum, ch) => sum + (ch.total_contacts || 0), 0);
  const hotLeads = channels.reduce((sum, ch) => sum + (ch.hot_leads || 0), 0);

  if (chartData.length === 0) {
    return (
      <Card className="!bg-white/5 !border-white/10 backdrop-blur-sm !ring-0">
        <Title className="!text-white">Channel Distribution</Title>
        <Text className="!text-white/60">No channel data available</Text>
      </Card>
    );
  }

  return (
    <Card className="!bg-white/5 !border-white/10 backdrop-blur-sm !ring-0">
      <Title className="!text-white">Channel Distribution</Title>
      <Text className="!text-white/60">
        {totalContacts.toLocaleString()} contacts across {channels.length} channels
      </Text>
      <BarList
        data={chartData}
        className="mt-4"
        valueFormatter={(value: number) => value.toLocaleString()}
        color="blue"
      />
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-2xl font-semibold text-white">{totalReplies}</p>
          <p className="text-white/60 text-sm">Replies</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-white">
            {totalContacts > 0 ? ((totalReplies / totalContacts) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-white/60 text-sm">Reply Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-amber-400">{hotLeads}</p>
          <p className="text-white/60 text-sm">Hot Leads</p>
        </div>
      </div>
    </Card>
  );
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

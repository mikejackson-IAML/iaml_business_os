'use client';

import { Users, UserCheck, Building2, ShieldCheck } from 'lucide-react';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { cn } from '@/dashboard-kit/lib/utils';

interface MetricsBarProps {
  metrics: {
    total_contacts: number;
    total_customers: number;
    total_companies: number;
    data_quality_score: number;
  };
}

function qualityColor(score: number): string {
  if (score > 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Contacts"
        value={metrics.total_contacts}
        format="number"
        icon={Users}
      />
      <MetricCard
        label="Customers"
        value={metrics.total_customers}
        format="number"
        icon={UserCheck}
      />
      <MetricCard
        label="Companies"
        value={metrics.total_companies}
        format="number"
        icon={Building2}
      />
      <MetricCard
        label="Data Quality"
        value={`${metrics.data_quality_score}%`}
        icon={ShieldCheck}
        description={
          metrics.data_quality_score > 80
            ? 'Healthy'
            : metrics.data_quality_score >= 50
              ? 'Needs attention'
              : 'Critical'
        }
      />
    </div>
  );
}

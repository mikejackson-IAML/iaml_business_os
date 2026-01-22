import { Users, Clock, CheckCircle2, Send, FileText, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import type { DashboardSummaryStats } from '@/lib/api/faculty-scheduler-queries';

interface SummaryCardsProps {
  stats: DashboardSummaryStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <MetricCard
        label="Total Programs"
        value={stats.total_programs}
        format="number"
        icon={FileText}
        description={`${stats.draft_programs} draft`}
      />
      <MetricCard
        label="Tier 0 (VIP)"
        value={stats.awaiting_tier_0}
        format="number"
        icon={Clock}
        status={stats.awaiting_tier_0 > 0 ? 'warning' : 'healthy'}
        description="VIP window"
      />
      <MetricCard
        label="Tier 1 (Local)"
        value={stats.awaiting_tier_1}
        format="number"
        icon={Clock}
        status={stats.awaiting_tier_1 > 0 ? 'warning' : 'healthy'}
        description="Local window"
      />
      <MetricCard
        label="Open"
        value={stats.open_programs}
        format="number"
        icon={Users}
        description="All qualified"
      />
      <MetricCard
        label="Filled"
        value={stats.filled_programs}
        format="number"
        icon={CheckCircle2}
        status="healthy"
        description="Instructors assigned"
      />
      <MetricCard
        label="Response Rate"
        value={`${stats.response_rate.toFixed(0)}%`}
        format="text"
        icon={Send}
        status={stats.response_rate >= 30 ? 'healthy' : stats.response_rate >= 15 ? 'warning' : 'critical'}
        description={`${stats.total_responded}/${stats.total_notified}`}
      />
    </div>
  );
}

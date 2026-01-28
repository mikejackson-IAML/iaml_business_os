'use client';

import { Users, Target, TrendingUp, MessageSquare, Mail, Phone, Linkedin, Monitor, BarChart3, GraduationCap, ArrowRight, CheckSquare, Globe, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { HealthScore } from '@/dashboard-kit/components/dashboard/health-score';
import { ActivityFeed } from '@/dashboard-kit/components/dashboard/activity-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ConversionFunnelChart } from './components/conversion-funnel-chart';
import { ChannelPerformanceChart } from './components/channel-performance-chart';
import { ActionCenterWidget } from '@/components/widgets/action-center-widget';
import { WeeklyFocusWidget } from '@/components/widgets/weekly-focus-widget';
import { ActionCenterBadge } from '@/components/nav/action-center-badge';
import type { Campaign, CampaignActivity, ChannelPerformance } from '@/lib/supabase/types';
import type { HealthStatus, ActivityItem } from '@/dashboard-kit/types';
import type { TaskCounts } from '@/lib/api/task-queries';
import type { TaskExtended } from '@/lib/api/task-types';

interface DashboardContentProps {
  metrics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalContacts: number;
    engagedContacts: number;
    registeredContacts: number;
    channelBreakdown: ChannelPerformance[];
  };
  campaigns: Campaign[];
  activities: CampaignActivity[];
  taskCounts: TaskCounts | null;
  weeklyFocusTask: TaskExtended | null;
  aiSuggestionCount: number;
}

// Convert CampaignActivity to ActivityItem format
function mapActivitiesToFeed(activities: CampaignActivity[]): ActivityItem[] {
  return activities.map((activity) => ({
    id: activity.id,
    type: activity.activity_type,
    title: formatActivityTitle(activity.activity_type),
    description: activity.channel || undefined,
    timestamp: new Date(activity.activity_at),
  }));
}

function formatActivityTitle(type: string): string {
  const titles: Record<string, string> = {
    sent: 'Message sent',
    delivered: 'Message delivered',
    opened: 'Email opened',
    clicked: 'Link clicked',
    replied: 'Reply received',
    connection_sent: 'Connection request sent',
    connection_accepted: 'Connection accepted',
    message_sent: 'LinkedIn message sent',
    quarterly_registered: 'Registered for Quarterly Updates',
    tag_changed: 'Lifecycle tag updated',
    branch_assigned: 'Assigned to GHL branch',
  };
  return titles[type] || type.replace(/_/g, ' ');
}

// Calculate health score based on engagement
function calculateHealthScore(metrics: DashboardContentProps['metrics']): {
  score: number;
  status: HealthStatus;
} {
  if (metrics.totalContacts === 0) {
    return { score: 0, status: 'warning' };
  }

  const engagementRate = (metrics.engagedContacts / metrics.totalContacts) * 100;
  const registrationRate = (metrics.registeredContacts / metrics.totalContacts) * 100;

  // Weight: 60% engagement, 40% registration
  const score = Math.round(engagementRate * 0.6 + registrationRate * 0.4);

  let status: HealthStatus = 'healthy';
  if (score < 30) status = 'critical';
  else if (score < 60) status = 'warning';

  return { score: Math.min(score, 100), status };
}

function getChannelIcon(channel: string | null) {
  switch (channel?.toLowerCase()) {
    case 'linkedin':
      return <Linkedin className="h-4 w-4" />;
    case 'smartlead':
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'phone':
      return <Phone className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

export function DashboardContent({ metrics, campaigns, activities, taskCounts, weeklyFocusTask, aiSuggestionCount }: DashboardContentProps) {
  const healthData = calculateHealthScore(metrics);
  const activityItems = mapActivitiesToFeed(activities);

  return (
    <div className="relative min-h-screen">
      {/* Background pattern */}
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="badge-live">LIVE</span>
              <h1 className="text-display-sm text-foreground">CEO Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground">
            Business operations overview • Campaign performance • Real-time metrics
          </p>

          {/* Quick Links to Department Dashboards */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/dashboard/action-center"
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-colors"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Action Center</span>
              <ArrowRight className="h-3 w-3" />
              <ActionCenterBadge />
            </Link>
            <Link
              href="/dashboard/digital"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
            >
              <Monitor className="h-4 w-4" />
              <span className="text-sm font-medium">Digital</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/dashboard/marketing"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Marketing</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/dashboard/programs"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="text-sm font-medium">Programs</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/dashboard/web-intel"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">Web Intel</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/dashboard/planning"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">Planning</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Main Metrics */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Action Center Widget */}
            <ActionCenterWidget counts={taskCounts} />

            {/* Weekly Focus Widget */}
            <WeeklyFocusWidget
              focusTask={weeklyFocusTask}
              suggestionCount={aiSuggestionCount}
            />

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total Campaigns"
                value={metrics.totalCampaigns}
                icon={Target}
                format="number"
              />
              <MetricCard
                label="Active Campaigns"
                value={metrics.activeCampaigns}
                icon={TrendingUp}
                status={metrics.activeCampaigns > 0 ? 'healthy' : 'warning'}
                format="number"
              />
              <MetricCard
                label="Total Contacts"
                value={metrics.totalContacts}
                icon={Users}
                format="number"
              />
              <MetricCard
                label="Engaged"
                value={metrics.engagedContacts}
                description={`${metrics.totalContacts > 0 ? Math.round((metrics.engagedContacts / metrics.totalContacts) * 100) : 0}% of total`}
                icon={MessageSquare}
                format="number"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ConversionFunnelChart
                totalContacts={metrics.totalContacts}
                engagedContacts={metrics.engagedContacts}
                registeredContacts={metrics.registeredContacts}
              />
              <ChannelPerformanceChart channels={metrics.channelBreakdown} />
            </div>

            {/* Campaigns Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No campaigns found. Create your first campaign to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-background-card-light border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {campaign.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {campaign.campaign_type || 'Campaign'} •{' '}
                            {campaign.status || 'Draft'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'active'
                                ? 'bg-success/20 text-success'
                                : campaign.status === 'completed'
                                ? 'bg-info/20 text-info'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            style={{
                              backgroundColor:
                                campaign.status === 'active'
                                  ? 'hsl(var(--success-muted))'
                                  : campaign.status === 'completed'
                                  ? 'hsl(var(--info-muted))'
                                  : undefined,
                              color:
                                campaign.status === 'active'
                                  ? 'hsl(var(--success))'
                                  : campaign.status === 'completed'
                                  ? 'hsl(var(--info))'
                                  : undefined,
                            }}
                          >
                            {campaign.status || 'Draft'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md">Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.channelBreakdown.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No channel data available yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {metrics.channelBreakdown.map((channel) => {
                      const total = channel.total_contacts || 0;
                      const active = channel.active || 0;
                      const replied = channel.replied || 0;
                      const progress = total > 0 ? (active / total) * 100 : 0;

                      return (
                        <div key={channel.channel_id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(channel.channel)}
                              <span className="font-medium capitalize">
                                {channel.channel}
                              </span>
                              {channel.platform && (
                                <span className="text-xs text-muted-foreground">
                                  via {channel.platform}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                {active} / {total} active
                              </span>
                              <span className="text-foreground font-medium">
                                {replied} replies
                              </span>
                              {(channel.hot_leads || 0) > 0 && (
                                <span
                                  className="font-medium"
                                  style={{ color: 'hsl(var(--warning))' }}
                                >
                                  {channel.hot_leads} hot
                                </span>
                              )}
                            </div>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Health Score */}
            <HealthScore
              score={healthData.score}
              status={healthData.status}
              label="Campaign Health"
              description="Based on engagement and registration rates"
              breakdown={[
                {
                  label: 'Engagement Rate',
                  score: metrics.totalContacts > 0
                    ? Math.round((metrics.engagedContacts / metrics.totalContacts) * 100)
                    : 0,
                  status:
                    metrics.totalContacts > 0 &&
                    metrics.engagedContacts / metrics.totalContacts > 0.3
                      ? 'healthy'
                      : metrics.engagedContacts / metrics.totalContacts > 0.1
                      ? 'warning'
                      : 'critical',
                },
                {
                  label: 'Registration Rate',
                  score: metrics.totalContacts > 0
                    ? Math.round((metrics.registeredContacts / metrics.totalContacts) * 100)
                    : 0,
                  status:
                    metrics.totalContacts > 0 &&
                    metrics.registeredContacts / metrics.totalContacts > 0.2
                      ? 'healthy'
                      : metrics.registeredContacts / metrics.totalContacts > 0.05
                      ? 'warning'
                      : 'critical',
                },
              ]}
              showBreakdown
            />

            {/* Conversion Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md">Conversions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-card-light">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="text-xl font-semibold">
                    {metrics.registeredContacts}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-card-light">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="text-xl font-semibold">
                    {metrics.totalContacts > 0
                      ? `${Math.round((metrics.registeredContacts / metrics.totalContacts) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <ActivityFeed
              activities={activityItems}
              title="Recent Activity"
              maxItems={8}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

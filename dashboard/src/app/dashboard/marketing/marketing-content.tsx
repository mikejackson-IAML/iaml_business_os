'use client';

import {
  Mail,
  MousePointer,
  Users,
  MessageSquare,
  Linkedin,
  UserPlus,
  Send,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { HealthScore } from '@/dashboard-kit/components/dashboard/health-score';
import { ActivityFeed } from '@/dashboard-kit/components/dashboard/activity-feed';
import { AlertList } from '@/dashboard-kit/components/dashboard/alert-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { Campaign, CampaignActivity } from '@/lib/supabase/types';
import type {
  MarketingMetricsData,
  MarketingAlert,
  LinkedInAutomationData,
} from '@/lib/supabase/queries';
import type { HealthStatus, AlertItem, ActivityItem } from '@/dashboard-kit/types';

interface MarketingContentProps {
  metrics: MarketingMetricsData;
  campaigns: Campaign[];
  alerts: MarketingAlert[];
  activities: CampaignActivity[];
  linkedIn: LinkedInAutomationData;
}

// Convert MarketingAlert to AlertItem format
function mapAlertsToAlertItems(alerts: MarketingAlert[]): AlertItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    category: alert.category,
    timestamp: alert.timestamp,
    dismissable: false,
  }));
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
    sent: 'Email sent',
    delivered: 'Email delivered',
    opened: 'Email opened',
    clicked: 'Link clicked',
    replied: 'Reply received',
    bounced: 'Email bounced',
    connection_sent: 'Connection request sent',
    connection_accepted: 'Connection accepted',
    message_sent: 'LinkedIn message sent',
    message_replied: 'LinkedIn reply received',
    quarterly_registered: 'Registered for Quarterly Updates',
    tag_changed: 'Lifecycle tag updated',
    branch_assigned: 'Assigned to GHL branch',
  };
  return titles[type] || type.replace(/_/g, ' ');
}

// Calculate marketing health score
function calculateHealthScore(
  metrics: MarketingMetricsData,
  linkedIn: LinkedInAutomationData,
  alerts: MarketingAlert[]
): {
  score: number;
  status: HealthStatus;
  breakdown: { label: string; score: number; status: HealthStatus }[];
} {
  // Email Deliverability (25%) - Based on bounce rate
  const deliverabilityScore = Math.max(0, 100 - metrics.bounceRate * 20);
  const deliverabilityStatus: HealthStatus =
    metrics.bounceRate < 2 ? 'healthy' : metrics.bounceRate < 5 ? 'warning' : 'critical';

  // List Health (20%) - Based on valid email percentage
  const validEmailRate = metrics.totalContacts > 0
    ? (metrics.validEmailContacts / metrics.totalContacts) * 100
    : 0;
  const listHealthScore = validEmailRate;
  const listHealthStatus: HealthStatus =
    validEmailRate > 90 ? 'healthy' : validEmailRate > 75 ? 'warning' : 'critical';

  // Campaign Performance (20%) - Based on open rate (target: 34%)
  const openRateTarget = 34;
  const campaignScore = Math.min(100, (metrics.openRate / openRateTarget) * 100);
  const campaignStatus: HealthStatus =
    metrics.openRate >= openRateTarget ? 'healthy' : metrics.openRate >= 20 ? 'warning' : 'critical';

  // LinkedIn Engagement (15%) - Based on response rate
  const linkedInScore = Math.min(100, linkedIn.responseRate * 5);
  const linkedInStatus: HealthStatus =
    linkedIn.responseRate >= 15 ? 'healthy' : linkedIn.responseRate >= 10 ? 'warning' : 'critical';

  // Click Rate (10%) - Based on CTR (target: 4.2%)
  const ctrTarget = 4.2;
  const ctrScore = Math.min(100, (metrics.clickRate / ctrTarget) * 100);
  const ctrStatus: HealthStatus =
    metrics.clickRate >= ctrTarget ? 'healthy' : metrics.clickRate >= 2 ? 'warning' : 'critical';

  // No Critical Alerts (10%)
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const alertScore = criticalAlerts === 0 ? 100 : criticalAlerts === 1 ? 50 : 0;
  const alertStatus: HealthStatus =
    criticalAlerts === 0 ? 'healthy' : criticalAlerts === 1 ? 'warning' : 'critical';

  // Weighted total
  const totalScore = Math.round(
    deliverabilityScore * 0.25 +
    listHealthScore * 0.20 +
    campaignScore * 0.20 +
    linkedInScore * 0.15 +
    ctrScore * 0.10 +
    alertScore * 0.10
  );

  const status: HealthStatus =
    totalScore >= 70 ? 'healthy' : totalScore >= 40 ? 'warning' : 'critical';

  return {
    score: totalScore,
    status,
    breakdown: [
      { label: 'Email Deliverability', score: Math.round(deliverabilityScore), status: deliverabilityStatus },
      { label: 'List Health', score: Math.round(listHealthScore), status: listHealthStatus },
      { label: 'Campaign Performance', score: Math.round(campaignScore), status: campaignStatus },
      { label: 'LinkedIn Engagement', score: Math.round(linkedInScore), status: linkedInStatus },
      { label: 'Click-Through Rate', score: Math.round(ctrScore), status: ctrStatus },
      { label: 'No Blockers', score: alertScore, status: alertStatus },
    ],
  };
}

export function MarketingContent({
  metrics,
  campaigns,
  alerts,
  activities,
  linkedIn,
}: MarketingContentProps) {
  const healthData = calculateHealthScore(metrics, linkedIn, alerts);
  const alertItems = mapAlertsToAlertItems(alerts);
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
              <h1 className="text-display-sm text-foreground">Marketing Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground">
            Email campaigns • LinkedIn automation • Deliverability metrics
          </p>
          <div className="mt-2">
            <Link
              href="/dashboard"
              className="text-sm text-accent-primary hover:underline"
            >
              &larr; Back to CEO Dashboard
            </Link>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Health Score - Left */}
          <div className="col-span-12 lg:col-span-4">
            <HealthScore
              score={healthData.score}
              status={healthData.status}
              label="Marketing Health"
              description="Based on deliverability, engagement, and list quality"
              breakdown={healthData.breakdown}
              showBreakdown
            />
          </div>

          {/* Key Metrics - Right */}
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Open Rate"
                value={metrics.openRate.toFixed(1)}
                format="percent"
                icon={Mail}
                target={34}
                status={metrics.openRate >= 34 ? 'healthy' : metrics.openRate >= 20 ? 'warning' : 'critical'}
                description={`${metrics.totalOpened.toLocaleString()} opens`}
              />
              <MetricCard
                label="Click Rate"
                value={metrics.clickRate.toFixed(1)}
                format="percent"
                icon={MousePointer}
                target={4.2}
                status={metrics.clickRate >= 4.2 ? 'healthy' : metrics.clickRate >= 2 ? 'warning' : 'critical'}
                description={`${metrics.totalClicked.toLocaleString()} clicks`}
              />
              <MetricCard
                label="Email List"
                value={metrics.validEmailContacts}
                format="number"
                icon={Users}
                description={`${metrics.totalContacts.toLocaleString()} total contacts`}
              />
              <MetricCard
                label="Response Rate"
                value={metrics.replyRate.toFixed(1)}
                format="percent"
                icon={MessageSquare}
                status={metrics.replyRate >= 5 ? 'healthy' : metrics.replyRate >= 2 ? 'warning' : 'critical'}
                description={`${metrics.totalReplied.toLocaleString()} replies`}
              />
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active campaigns. Start a new campaign to see it here.
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
                            {campaign.started_at
                              ? `Started ${new Date(campaign.started_at).toLocaleDateString()}`
                              : 'Not started'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {campaign.primary_offer && (
                            <span className="text-xs text-muted-foreground hidden md:inline">
                              {campaign.primary_offer}
                            </span>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium`}
                            style={{
                              backgroundColor:
                                campaign.status === 'active'
                                  ? 'hsl(var(--success-muted))'
                                  : campaign.status === 'completed'
                                  ? 'hsl(var(--info-muted))'
                                  : 'hsl(var(--muted))',
                              color:
                                campaign.status === 'active'
                                  ? 'hsl(var(--success))'
                                  : campaign.status === 'completed'
                                  ? 'hsl(var(--info))'
                                  : 'hsl(var(--muted-foreground))',
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
          </div>

          {/* Alerts */}
          <div className="col-span-12 lg:col-span-4">
            <AlertList
              alerts={alertItems}
              title="Needs Attention"
              maxItems={5}
            />
          </div>

          {/* LinkedIn Automation */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <Linkedin className="h-5 w-5" />
                  LinkedIn Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserPlus className="h-4 w-4" />
                      Connections Sent
                    </div>
                    <div className="text-2xl font-semibold">
                      {linkedIn.connectionsSent.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Acceptance Rate
                    </div>
                    <div className="text-2xl font-semibold">
                      {linkedIn.acceptanceRate.toFixed(1)}%
                    </div>
                    <Progress
                      value={linkedIn.acceptanceRate}
                      className="h-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Send className="h-4 w-4" />
                      Messages Sent
                    </div>
                    <div className="text-2xl font-semibold">
                      {linkedIn.messagesSent.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      Response Rate
                    </div>
                    <div className="text-2xl font-semibold">
                      {linkedIn.responseRate.toFixed(1)}%
                    </div>
                    <Progress
                      value={linkedIn.responseRate}
                      className="h-1"
                    />
                  </div>
                </div>

                {linkedIn.activeContacts > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active LinkedIn Contacts</span>
                      <span className="font-medium">{linkedIn.activeContacts.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="col-span-12 lg:col-span-4">
            <ActivityFeed
              activities={activityItems}
              title="Recent Activity"
              maxItems={8}
            />
          </div>

          {/* Email Deliverability Stats */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md">Email Deliverability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Total Sent</div>
                    <div className="text-2xl font-semibold">
                      {metrics.totalSent.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Delivered</div>
                    <div className="text-2xl font-semibold">
                      {(metrics.totalSent - metrics.totalBounced).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.totalSent > 0
                        ? `${((1 - metrics.bounceRate / 100) * 100).toFixed(1)}% delivery rate`
                        : '-'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Bounced</div>
                    <div
                      className="text-2xl font-semibold"
                      style={{
                        color:
                          metrics.bounceRate > 5
                            ? 'hsl(var(--error))'
                            : metrics.bounceRate > 2
                            ? 'hsl(var(--warning))'
                            : undefined,
                      }}
                    >
                      {metrics.totalBounced.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.bounceRate.toFixed(2)}% bounce rate
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Invalid Emails</div>
                    <div className="text-2xl font-semibold">
                      {metrics.invalidEmailContacts.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      in contact list
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

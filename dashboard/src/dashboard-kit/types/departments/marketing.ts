import type { DepartmentConfig, MetricValue, AlertItem, HealthStatus } from '../dashboard';

// Marketing Department specific types

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'linkedin' | 'social' | 'ads';
  status: 'active' | 'paused' | 'completed' | 'draft';
  openRate?: number;
  clickRate?: number;
  replyRate?: number;
  sentCount?: number;
  startDate?: Date;
  endDate?: Date;
  targetAudience?: string;
}

export interface EmailListMetrics {
  totalSubscribers: number;
  newSubscribers7d: number;
  unsubscribes7d: number;
  growthRate: number;
  bounceRate: number;
  averageOpenRate: number;
  averageClickRate: number;
}

export interface LinkedInAutomation {
  connectionsThisMonth: number;
  connectionRequestsSent: number;
  acceptanceRate: number;
  messagesResponseRate: number;
  dailyLimitUsage: number;
  profileViews: number;
}

export interface Recommendation {
  id: string;
  category: 'campaign_timing' | 'segment_opportunity' | 'content_suggestion';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionCommand?: string;
}

export interface MarketingMetrics {
  emailListSize: MetricValue;
  avgOpenRate: MetricValue;
  avgClickRate: MetricValue;
  linkedInFollowers: MetricValue;
  connectionsMonth: MetricValue;
  responseRate: MetricValue;
  dailyLimitUsage: MetricValue;
}

export interface MarketingDashboardData {
  metrics: MarketingMetrics;
  activeCampaigns: Campaign[];
  emailMetrics: EmailListMetrics;
  linkedInMetrics: LinkedInAutomation;
  alerts: AlertItem[];
  recommendations: Recommendation[];
  overallHealth: HealthStatus;
}

// Marketing department configuration - matches the JSON spec provided
export const marketingDepartmentConfig: DepartmentConfig = {
  department: 'marketing',
  title: 'Marketing',
  layout: {
    sections: [
      {
        id: 'health',
        title: 'Department Health',
        type: 'health-score',
        position: 'top',
        config: {
          show_trend: true,
          trend_period_days: 7,
        },
      },
      {
        id: 'key-metrics',
        title: 'Key Metrics',
        type: 'metrics-grid',
        position: 'main',
        metrics: [
          {
            id: 'email_list_size',
            label: 'Email List',
            source: 'supabase',
            query: 'marketing_contacts.count',
            format: 'number',
            trend: true,
            icon: 'users',
          },
          {
            id: 'avg_open_rate',
            label: 'Avg Open Rate',
            source: 'smartlead',
            query: 'campaigns.avg_open_rate_30d',
            format: 'percent',
            target: 34,
            trend: true,
            icon: 'mail-open',
          },
          {
            id: 'avg_click_rate',
            label: 'Avg CTR',
            source: 'smartlead',
            query: 'campaigns.avg_click_rate_30d',
            format: 'percent',
            target: 4.2,
            trend: true,
            icon: 'cursor-click',
          },
          {
            id: 'linkedin_followers',
            label: 'LinkedIn Followers',
            source: 'manual',
            format: 'number',
            trend: true,
            icon: 'linkedin',
          },
        ],
      },
      {
        id: 'active-campaigns',
        title: 'Active Campaigns',
        type: 'campaign-list',
        position: 'main',
        config: {
          max_items: 5,
          show_performance: true,
          columns: ['name', 'type', 'open_rate', 'status'],
        },
      },
      {
        id: 'alerts',
        title: 'Needs Attention',
        type: 'alert-list',
        position: 'sidebar',
        config: {
          max_items: 5,
          severity_filter: ['warning', 'critical'],
          categories: ['deliverability', 'list_health', 'automation'],
        },
      },
      {
        id: 'linkedin-automation',
        title: 'LinkedIn Automation',
        type: 'metrics-grid',
        position: 'main',
        metrics: [
          {
            id: 'connections_month',
            label: 'Connections This Month',
            source: 'phantombuster',
            format: 'number',
          },
          {
            id: 'response_rate',
            label: 'Response Rate',
            source: 'heyreach',
            format: 'percent',
          },
          {
            id: 'daily_limit_usage',
            label: 'Daily Limit Usage',
            source: 'phantombuster',
            format: 'percent',
            warningThreshold: 90,
          },
        ],
      },
      {
        id: 'recommendations',
        title: 'AI Recommendations',
        type: 'recommendation-list',
        position: 'sidebar',
        config: {
          max_items: 3,
          categories: ['campaign_timing', 'segment_opportunity', 'content_suggestion'],
        },
      },
    ],
  },
  refreshIntervalSeconds: 300,
};

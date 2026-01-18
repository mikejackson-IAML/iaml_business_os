import type { DepartmentConfig, MetricValue, AlertItem, HealthStatus } from '../dashboard';

// Lead Intelligence Department specific types

export interface DomainHealth {
  id: string;
  domain: string;
  healthScore: number;
  status: 'active' | 'warming' | 'resting' | 'blacklisted';
  dailyLimit: number;
  sentToday: number;
  bounceRate: number;
  spamRate: number;
  lastSentAt?: Date;
  warmingDay?: number;
  cooldownUntil?: Date;
}

export interface EmailInbox {
  id: string;
  domainId: string;
  domainName: string;
  inboxEmail: string;
  displayName?: string;
  status: 'active' | 'warming' | 'paused' | 'disconnected';
  sentToday: number;
  sentThisWeek: number;
  dailyLimit: number;
  bounceRate: number;
  openRate: number;
  replyRate: number;
  spamRate: number;
  warmupEnabled: boolean;
  warmupDay?: number;
  isConnected: boolean;
  lastError?: string;
  healthScore: number;
}

export interface PlatformStatusInfo {
  id: string;
  name: 'phantombuster' | 'apollo' | 'apify' | 'heyreach' | 'smartlead';
  displayName: string;
  status: 'operational' | 'degraded' | 'down' | 'rate_limited';
  creditsRemaining?: number;
  creditsTotal?: number;
  dailyLimitUsed?: number;
  dailyLimitTotal?: number;
  lastSyncAt?: Date;
  errorMessage?: string;
}

export interface LeadPipeline {
  id: string;
  source: string;
  leadsSourced: number;
  leadsValidated: number;
  leadsEnriched: number;
  leadsReady: number;
  validationRate: number;
  importedAt: Date;
}

export interface CapacityMetrics {
  totalDailyCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  utilizationPercent: number;
  activeDomains: number;
  warmingDomains: number;
  restingDomains: number;
}

export interface LeadIntelligenceMetrics {
  dailyEmailCapacity: MetricValue;
  capacityUtilization: MetricValue;
  leadsSourcedThisWeek: MetricValue;
  emailValidationRate: MetricValue;
  avgDomainHealth: MetricValue;
  platformStatus: MetricValue;
}

export interface LeadIntelligenceDashboardData {
  metrics: LeadIntelligenceMetrics;
  capacity: CapacityMetrics;
  domains: DomainHealth[];
  inboxes: EmailInbox[];
  platforms: PlatformStatusInfo[];
  recentImports: LeadPipeline[];
  alerts: AlertItem[];
  overallHealth: HealthStatus;
}

// Lead Intelligence department configuration - matches the JSON spec provided
export const leadIntelligenceDepartmentConfig: DepartmentConfig = {
  department: 'lead-intelligence',
  title: 'Lead Intelligence',
  summaryPrompt: 'Provide a brief status of lead intelligence including: email sending capacity, lead pipeline status, platform health, domain health, and any critical issues affecting lead sourcing or campaign capacity.',
  keyMetrics: [
    {
      id: 'daily_email_capacity',
      label: 'Daily Email Capacity',
      description: 'Total emails that can be sent today across all domains',
      source: 'api',
      query: 'capacity_calculations',
      format: 'number',
      target: 2000,
      trend: true,
      icon: 'mail',
    },
    {
      id: 'capacity_utilization',
      label: 'Capacity Utilization',
      description: 'Percentage of sending capacity currently in use',
      source: 'api',
      query: 'capacity_calculations',
      format: 'percent',
      target: 85, // target is BELOW this
      trend: true,
      icon: 'gauge',
      warningThreshold: 85,
      criticalThreshold: 95,
    },
    {
      id: 'leads_sourced_week',
      label: 'Leads Sourced This Week',
      description: 'New leads imported from all platforms',
      source: 'api',
      query: 'lead_imports',
      format: 'number',
      target: 500,
      trend: true,
      icon: 'users',
    },
    {
      id: 'email_validation_rate',
      label: 'Email Validation Rate',
      description: 'Percentage of leads with valid emails',
      source: 'api',
      query: 'validation_results',
      format: 'percent',
      target: 90,
      trend: true,
      icon: 'check-circle',
    },
    {
      id: 'avg_domain_health',
      label: 'Avg Domain Health',
      description: 'Average health score across active domains',
      source: 'api',
      query: 'domain_health',
      format: 'number',
      target: 85,
      trend: true,
      icon: 'shield',
      warningThreshold: 70,
      criticalThreshold: 50,
    },
    {
      id: 'platform_status',
      label: 'Platform Status',
      description: 'All scraping platforms operational',
      source: 'api',
      query: 'platform_status',
      format: 'text',
      trend: false,
      icon: 'server',
    },
  ],
  quickActions: [
    {
      id: 'capacity_report',
      name: 'Check Capacity',
      command: '/capacity-report',
      description: 'View current sending capacity',
      icon: 'bar-chart',
    },
    {
      id: 'domain_health',
      name: 'Domain Status',
      command: '/domain-health',
      description: 'Check domain health scores',
      icon: 'shield',
    },
    {
      id: 'platform_health',
      name: 'Platform Health',
      command: '/platform-status',
      description: 'View scraping platform status',
      icon: 'server',
    },
  ],
  statusIndicators: {
    healthy: {
      color: 'green',
      conditions: [
        'capacity utilization < 85%',
        'all platforms operational',
        'avg domain health > 85',
        'validation rate > 90%',
        'no critical alerts',
      ],
    },
    warning: {
      color: 'yellow',
      conditions: [
        'capacity utilization 85-95%',
        'platform rate limit warnings',
        'avg domain health 70-85',
        'validation rate 80-90%',
        'Apollo credits < 30%',
      ],
    },
    critical: {
      color: 'red',
      conditions: [
        'capacity utilization > 95%',
        'platform banned or restricted',
        'domain blacklisted',
        'compliance violation detected',
        'sync failures affecting campaigns',
      ],
    },
  },
  commonQuestions: [
    'How many leads can we handle right now?',
    "What's our sending capacity?",
    'Are there any platform issues?',
    "What's the domain health status?",
    'How many leads did we source this week?',
    'Are we running low on Apollo credits?',
    'Which domains need rest?',
    "What's our validation rate?",
  ],
  dashboardSections: [
    {
      id: 'capacity',
      title: 'Capacity Status',
      type: 'metrics-grid',
      position: 'top',
      description: 'Email sending capacity and utilization',
    },
    {
      id: 'pipeline',
      title: 'Lead Pipeline',
      type: 'metrics-summary',
      position: 'main',
      description: 'Leads sourced, validated, and ready for campaigns',
    },
    {
      id: 'platforms',
      title: 'Platform Status',
      type: 'platform-status',
      position: 'main',
      description: 'PhantomBuster, Apollo, Apify health and limits',
    },
    {
      id: 'domains',
      title: 'Domain Health',
      type: 'program-table',
      position: 'main',
      description: 'Active, warming, and resting domain status',
    },
    {
      id: 'quality',
      title: 'Data Quality',
      type: 'metrics-grid',
      position: 'sidebar',
      description: 'Validation rates, enrichment, compliance',
    },
  ],
  refreshIntervalSeconds: 300,
};

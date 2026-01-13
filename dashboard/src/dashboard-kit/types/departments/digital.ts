import type { DepartmentConfig, MetricValue, AlertItem, ActivityItem } from '../dashboard';

// Digital Department specific types

export interface DeploymentRecord {
  id: string;
  environment: 'production' | 'preview' | 'development';
  status: 'success' | 'failed' | 'building' | 'queued' | 'cancelled';
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  createdAt: Date;
  completedAt?: Date;
  duration?: number;
  url?: string;
}

export interface UptimeCheck {
  id: string;
  name: string;
  url: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  uptimePercent: number;
  incidents24h: number;
}

export interface LighthouseAudit {
  id: string;
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  lcp: number; // Largest Contentful Paint in seconds
  fid: number; // First Input Delay in ms
  cls: number; // Cumulative Layout Shift
  auditedAt: Date;
}

export interface DigitalMetrics {
  uptime: MetricValue;
  performanceScore: MetricValue;
  deploymentSuccessRate: MetricValue;
  pageLoadTime: MetricValue;
  // Additional metrics
  totalVisitors24h?: number;
  activeUsers?: number;
  errorRate?: number;
  avgResponseTime?: number;
}

export interface DigitalDashboardData {
  metrics: DigitalMetrics;
  recentDeployments: DeploymentRecord[];
  uptimeChecks: UptimeCheck[];
  latestAudit?: LighthouseAudit;
  alerts: AlertItem[];
  recentActivity: ActivityItem[];
}

// Digital department configuration - matches the JSON spec provided
export const digitalDepartmentConfig: DepartmentConfig = {
  department: 'digital',
  title: 'Digital',
  summaryPrompt: 'Provide a brief status of the IAML website including: site uptime, recent deployments, performance scores, and any critical issues.',
  keyMetrics: [
    {
      id: 'uptime',
      label: 'Uptime',
      description: 'Website availability over last 30 days',
      source: 'api',
      query: 'uptime_checks',
      format: 'percent',
      target: 99.9,
      trend: true,
      icon: 'activity',
    },
    {
      id: 'performance_score',
      label: 'Performance Score',
      description: 'Average Lighthouse performance score',
      source: 'api',
      query: 'lighthouse_audits',
      format: 'number',
      target: 80,
      trend: true,
      icon: 'zap',
      warningThreshold: 70,
      criticalThreshold: 50,
    },
    {
      id: 'deployment_success_rate',
      label: 'Deployment Success Rate',
      description: 'Successful deploys / total deploys',
      source: 'vercel',
      query: 'vercel_deployments',
      format: 'percent',
      target: 95,
      trend: true,
      icon: 'rocket',
    },
    {
      id: 'page_load_time',
      label: 'Page Load Time',
      description: 'Average LCP across key pages',
      source: 'api',
      query: 'lighthouse_audits',
      format: 'text',
      target: 2.5,
      trend: true,
      icon: 'clock',
    },
  ],
  quickActions: [
    {
      id: 'deploy',
      name: 'Deploy to Production',
      command: '/deploy',
      description: 'Push latest changes live',
      icon: 'rocket',
    },
    {
      id: 'health_check',
      name: 'Run Health Check',
      command: '/smoke',
      description: 'Quick site verification',
      icon: 'heart-pulse',
    },
    {
      id: 'performance',
      name: 'Check Performance',
      command: '/speed-optimize',
      description: 'Analyze and optimize speed',
      icon: 'gauge',
    },
  ],
  statusIndicators: {
    healthy: {
      color: 'green',
      conditions: ['uptime > 99.5%', 'no critical alerts', 'performance > 80'],
    },
    warning: {
      color: 'yellow',
      conditions: ['uptime 98-99.5%', 'performance 60-80', 'pending issues'],
    },
    critical: {
      color: 'red',
      conditions: ['uptime < 98%', 'site down', 'payment flow broken', 'security vulnerability'],
    },
  },
  commonQuestions: [
    "How's the website doing?",
    'Any site issues?',
    'When was the last deployment?',
    "What's our site performance?",
    'Are registrations working?',
  ],
  refreshIntervalSeconds: 60,
};

// Lead Intelligence Dashboard API
// Queries Supabase for domain health, capacity, and lead pipeline data
// Also integrates with external APIs for platform status

import { getServerClient } from '@/lib/supabase/server';
import type {
  DomainHealth,
  PlatformStatusInfo,
  LeadPipeline,
  CapacityMetrics,
  LeadIntelligenceMetrics,
  LeadIntelligenceDashboardData,
} from '@/dashboard-kit/types/departments/lead-intelligence';
import type { AlertItem, HealthStatus, ActivityItem } from '@/dashboard-kit/types';

// ============================================
// Types
// ============================================

export interface Domain {
  id: string;
  domain_name: string;
  status: 'active' | 'warming' | 'resting' | 'blacklisted';
  daily_limit: number;
  warmup_day: number | null;
  warmup_start_date: string | null;
  warmup_target_limit: number | null;
  health_score: number;
  bounce_rate: number;
  spam_rate: number;
  open_rate: number;
  sent_today: number;
  sent_this_week: number;
  last_sent_at: string | null;
  cooldown_until: string | null;
  cooldown_reason: string | null;
  platform: string;
  platform_domain_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadSource {
  id: string;
  name: string;
  display_name: string;
  source_type: string | null;
  status: 'operational' | 'degraded' | 'down' | 'rate_limited';
  last_status_check: string | null;
  error_message: string | null;
  credits_remaining: number | null;
  credits_total: number | null;
  daily_limit_used: number;
  daily_limit_total: number | null;
  api_endpoint: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LeadImport {
  id: string;
  source_id: string | null;
  source_name: string;
  import_name: string | null;
  leads_sourced: number;
  leads_validated: number;
  leads_enriched: number;
  leads_ready: number;
  leads_rejected: number;
  validation_rate: number | null;
  enrichment_rate: number | null;
  duplicate_rate: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  metadata: Record<string, unknown>;
  imported_at: string;
  completed_at: string | null;
}

export interface SendingCapacity {
  id: string;
  calculation_date: string;
  total_daily_capacity: number | null;
  used_capacity: number | null;
  available_capacity: number | null;
  active_domains: number | null;
  warming_domains: number | null;
  resting_domains: number | null;
  blacklisted_domains: number | null;
  utilization_percent: number | null;
  calculated_at: string;
}

export interface DomainSummary {
  total_domains: number | null;
  active_domains: number | null;
  warming_domains: number | null;
  resting_domains: number | null;
  blacklisted_domains: number | null;
  avg_active_health: number | null;
  avg_overall_health: number | null;
  total_active_capacity: number | null;
  total_sent_today: number | null;
}

export interface LeadPipelineSummary {
  leads_sourced_week: number | null;
  leads_validated_week: number | null;
  leads_enriched_week: number | null;
  leads_ready_week: number | null;
  leads_rejected_week: number | null;
  avg_validation_rate: number | null;
  import_count: number | null;
}

export interface CapacityDashboard extends SendingCapacity {
  status: 'healthy' | 'warning' | 'critical';
}

export interface LeadIntelActivity {
  id: string;
  activity_type: string;
  description: string | null;
  source_name: string | null;
  domain_id: string | null;
  lead_import_id: string | null;
  lead_source_id: string | null;
  metadata: Record<string, unknown>;
  activity_at: string;
}

export interface LeadIntelligenceAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'domain' | 'platform' | 'capacity' | 'data_quality' | 'compliance';
  timestamp: Date;
}

// ============================================
// Supabase Queries
// ============================================

/**
 * Fetch all domains with health data
 */
export async function getDomains(): Promise<Domain[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .order('status', { ascending: true })
    .order('health_score', { ascending: false });

  if (error) {
    console.error('Error fetching domains:', error);
    return [];
  }

  return (data as Domain[]) || [];
}

/**
 * Fetch domain summary statistics
 */
export async function getDomainSummary(): Promise<DomainSummary | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('domain_summary')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching domain summary:', error);
    return null;
  }

  return data as DomainSummary;
}

/**
 * Fetch lead sources with status
 */
export async function getLeadSources(): Promise<LeadSource[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('lead_sources')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching lead sources:', error);
    return [];
  }

  return (data as LeadSource[]) || [];
}

/**
 * Fetch recent lead imports
 */
export async function getRecentImports(limit = 10): Promise<LeadImport[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('lead_imports')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching lead imports:', error);
    return [];
  }

  return (data as LeadImport[]) || [];
}

/**
 * Fetch lead pipeline summary (last 7 days)
 */
export async function getLeadPipelineSummary(): Promise<LeadPipelineSummary | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('lead_pipeline_summary')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching lead pipeline summary:', error);
    return null;
  }

  return data as LeadPipelineSummary;
}

/**
 * Fetch current capacity status
 */
export async function getCapacityStatus(): Promise<CapacityDashboard | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('capacity_dashboard')
    .select('*')
    .single();

  if (error) {
    // No capacity data for today yet - this is expected
    console.warn('No capacity data for today:', error.message);
    return null;
  }

  return data as CapacityDashboard;
}

/**
 * Fetch recent activity
 */
export async function getLeadIntelligenceActivity(limit = 15): Promise<LeadIntelActivity[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('lead_intelligence_activity')
    .select('*')
    .order('activity_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching lead intelligence activity:', error);
    return [];
  }

  return (data as LeadIntelActivity[]) || [];
}

// ============================================
// External API Queries
// ============================================

interface ApolloCreditsResponse {
  credits_remaining: number;
  credits_total: number;
  daily_credits_used: number;
  daily_credits_limit: number;
}

/**
 * Fetch Apollo API credits status
 */
export async function getApolloCredits(): Promise<ApolloCreditsResponse | null> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    console.warn('Apollo API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.apollo.io/v1/auth/health', {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error('Apollo API error:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      credits_remaining: data.credits_info?.credits_remaining || 0,
      credits_total: data.credits_info?.credits_total || 0,
      daily_credits_used: data.credits_info?.daily_credits_used || 0,
      daily_credits_limit: data.credits_info?.daily_credits_limit || 0,
    };
  } catch (error) {
    console.error('Error fetching Apollo credits:', error);
    return null;
  }
}

interface PhantomBusterStatusResponse {
  status: 'operational' | 'degraded' | 'down' | 'rate_limited';
  daily_actions_used: number;
  daily_actions_limit: number;
  weekly_actions_used: number;
  weekly_actions_limit: number;
}

/**
 * Fetch PhantomBuster status
 */
export async function getPhantomBusterStatus(): Promise<PhantomBusterStatusResponse | null> {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY;

  if (!apiKey) {
    console.warn('PhantomBuster API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.phantombuster.com/api/v2/user', {
      headers: {
        'X-Phantombuster-Key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return {
        status: response.status === 429 ? 'rate_limited' : 'down',
        daily_actions_used: 0,
        daily_actions_limit: 0,
        weekly_actions_used: 0,
        weekly_actions_limit: 0,
      };
    }

    const data = await response.json();

    // Determine status based on usage
    let status: 'operational' | 'degraded' | 'rate_limited' = 'operational';
    const dailyUsage = data.dailyActionsLimit > 0
      ? (data.dailyActionsUsed / data.dailyActionsLimit) * 100
      : 0;
    if (dailyUsage >= 95) status = 'rate_limited';
    else if (dailyUsage >= 80) status = 'degraded';

    return {
      status,
      daily_actions_used: data.dailyActionsUsed || 0,
      daily_actions_limit: data.dailyActionsLimit || 0,
      weekly_actions_used: data.weeklyActionsUsed || 0,
      weekly_actions_limit: data.weeklyActionsLimit || 0,
    };
  } catch (error) {
    console.error('Error fetching PhantomBuster status:', error);
    return null;
  }
}

// ============================================
// Data Transformation
// ============================================

/**
 * Transform database domains to dashboard format
 */
export function transformDomainsToDashboard(domains: Domain[]): DomainHealth[] {
  return domains.map((domain) => ({
    id: domain.id,
    domain: domain.domain_name,
    healthScore: domain.health_score,
    status: domain.status,
    dailyLimit: domain.daily_limit,
    sentToday: domain.sent_today,
    bounceRate: Number(domain.bounce_rate),
    spamRate: Number(domain.spam_rate),
    lastSentAt: domain.last_sent_at ? new Date(domain.last_sent_at) : undefined,
    warmingDay: domain.warmup_day || undefined,
    cooldownUntil: domain.cooldown_until ? new Date(domain.cooldown_until) : undefined,
  }));
}

/**
 * Transform lead sources to platform status format
 */
export function transformSourcesToPlatforms(
  sources: LeadSource[],
  apolloData: ApolloCreditsResponse | null,
  phantomData: PhantomBusterStatusResponse | null
): PlatformStatusInfo[] {
  return sources.map((source) => {
    let credits = source.credits_remaining;
    let creditsTotal = source.credits_total;
    let dailyUsed = source.daily_limit_used;
    let dailyTotal = source.daily_limit_total;
    let status = source.status;

    // Override with live API data if available
    if (source.name === 'apollo' && apolloData) {
      credits = apolloData.credits_remaining;
      creditsTotal = apolloData.credits_total;
      dailyUsed = apolloData.daily_credits_used;
      dailyTotal = apolloData.daily_credits_limit;
      status = credits && creditsTotal && credits / creditsTotal < 0.1 ? 'degraded' : 'operational';
    }

    if (source.name === 'phantombuster' && phantomData) {
      dailyUsed = phantomData.daily_actions_used;
      dailyTotal = phantomData.daily_actions_limit;
      status = phantomData.status;
    }

    return {
      id: source.id,
      name: source.name as PlatformStatusInfo['name'],
      displayName: source.display_name,
      status,
      creditsRemaining: credits || undefined,
      creditsTotal: creditsTotal || undefined,
      dailyLimitUsed: dailyUsed || undefined,
      dailyLimitTotal: dailyTotal || undefined,
      lastSyncAt: source.last_status_check ? new Date(source.last_status_check) : undefined,
      errorMessage: source.error_message || undefined,
    };
  });
}

/**
 * Transform lead imports to pipeline format
 */
export function transformImportsToPipeline(imports: LeadImport[]): LeadPipeline[] {
  return imports.map((imp) => ({
    id: imp.id,
    source: imp.source_name,
    leadsSourced: imp.leads_sourced,
    leadsValidated: imp.leads_validated,
    leadsEnriched: imp.leads_enriched,
    leadsReady: imp.leads_ready,
    validationRate: imp.validation_rate ? Number(imp.validation_rate) : 0,
    importedAt: new Date(imp.imported_at),
  }));
}

/**
 * Build capacity metrics from dashboard data
 */
export function buildCapacityMetrics(
  capacity: CapacityDashboard | null,
  domainSummary: DomainSummary | null
): CapacityMetrics {
  return {
    totalDailyCapacity: capacity?.total_daily_capacity || domainSummary?.total_active_capacity || 0,
    usedCapacity: capacity?.used_capacity || domainSummary?.total_sent_today || 0,
    availableCapacity: capacity?.available_capacity ||
      ((domainSummary?.total_active_capacity || 0) - (domainSummary?.total_sent_today || 0)),
    utilizationPercent: capacity?.utilization_percent
      ? Number(capacity.utilization_percent)
      : domainSummary?.total_active_capacity && domainSummary.total_active_capacity > 0
        ? ((domainSummary.total_sent_today || 0) / domainSummary.total_active_capacity) * 100
        : 0,
    activeDomains: domainSummary?.active_domains || 0,
    warmingDomains: domainSummary?.warming_domains || 0,
    restingDomains: domainSummary?.resting_domains || 0,
  };
}

// ============================================
// Health Score Calculation
// ============================================

/**
 * Calculate Lead Intelligence health score
 * Based on 5 weighted components from DEPARTMENT.md
 */
export function calculateLeadIntelligenceHealth(
  platforms: PlatformStatusInfo[],
  capacity: CapacityMetrics,
  domainSummary: DomainSummary | null,
  pipelineSummary: LeadPipelineSummary | null,
  alerts: LeadIntelligenceAlert[]
): {
  score: number;
  status: HealthStatus;
  breakdown: { label: string; score: number; status: HealthStatus; weight: number }[];
} {
  // Platform Health (25%) - All platforms operational
  const operationalPlatforms = platforms.filter((p) => p.status === 'operational').length;
  const platformScore = platforms.length > 0
    ? Math.round((operationalPlatforms / platforms.length) * 100)
    : 100;
  const platformStatus: HealthStatus =
    platformScore >= 80 ? 'healthy' : platformScore >= 50 ? 'warning' : 'critical';

  // Capacity Available (25%) - Not at critical threshold
  const capacityScore = Math.max(0, Math.round(100 - capacity.utilizationPercent));
  const capacityStatus: HealthStatus =
    capacity.utilizationPercent < 85
      ? 'healthy'
      : capacity.utilizationPercent < 95
        ? 'warning'
        : 'critical';

  // Data Quality (20%) - Validation + enrichment rates
  const validationRate = pipelineSummary?.avg_validation_rate || 0;
  const dataQualityScore = Math.round(validationRate);
  const dataQualityStatus: HealthStatus =
    validationRate >= 90 ? 'healthy' : validationRate >= 80 ? 'warning' : 'critical';

  // Domain Health (20%) - Average domain health score
  const avgDomainHealth = domainSummary?.avg_active_health || 0;
  const domainHealthScore = Math.round(avgDomainHealth);
  const domainHealthStatus: HealthStatus =
    avgDomainHealth >= 85 ? 'healthy' : avgDomainHealth >= 70 ? 'warning' : 'critical';

  // No Critical Blockers (10%) - Binary
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const blockerScore = criticalAlerts === 0 ? 100 : criticalAlerts === 1 ? 50 : 0;
  const blockerStatus: HealthStatus =
    criticalAlerts === 0 ? 'healthy' : criticalAlerts === 1 ? 'warning' : 'critical';

  // Weighted total
  const totalScore = Math.round(
    platformScore * 0.25 +
      capacityScore * 0.25 +
      dataQualityScore * 0.2 +
      domainHealthScore * 0.2 +
      blockerScore * 0.1
  );

  const status: HealthStatus =
    totalScore >= 70 ? 'healthy' : totalScore >= 40 ? 'warning' : 'critical';

  return {
    score: totalScore,
    status,
    breakdown: [
      { label: 'Platform Health', score: platformScore, status: platformStatus, weight: 25 },
      { label: 'Capacity Available', score: capacityScore, status: capacityStatus, weight: 25 },
      { label: 'Data Quality', score: dataQualityScore, status: dataQualityStatus, weight: 20 },
      { label: 'Domain Health', score: domainHealthScore, status: domainHealthStatus, weight: 20 },
      { label: 'No Blockers', score: blockerScore, status: blockerStatus, weight: 10 },
    ],
  };
}

// ============================================
// Alert Generation
// ============================================

/**
 * Generate alerts based on current metrics
 */
export function generateLeadIntelligenceAlerts(
  platforms: PlatformStatusInfo[],
  domains: DomainHealth[],
  capacity: CapacityMetrics,
  pipelineSummary: LeadPipelineSummary | null
): LeadIntelligenceAlert[] {
  const alerts: LeadIntelligenceAlert[] = [];
  const now = new Date();

  // Platform alerts
  platforms.forEach((platform) => {
    if (platform.status === 'down') {
      alerts.push({
        id: `platform-down-${platform.id}`,
        title: `${platform.displayName} Platform Down`,
        description: platform.errorMessage || 'Platform is currently unavailable',
        severity: 'critical',
        category: 'platform',
        timestamp: now,
      });
    } else if (platform.status === 'rate_limited') {
      alerts.push({
        id: `platform-rate-limited-${platform.id}`,
        title: `${platform.displayName} Rate Limited`,
        description: 'Daily action limit reached',
        severity: 'warning',
        category: 'platform',
        timestamp: now,
      });
    }

    // Credits warning
    if (platform.creditsRemaining !== undefined && platform.creditsTotal !== undefined) {
      const creditsPercent = (platform.creditsRemaining / platform.creditsTotal) * 100;
      if (creditsPercent < 10) {
        alerts.push({
          id: `credits-critical-${platform.id}`,
          title: `${platform.displayName} Credits Critical`,
          description: `Only ${platform.creditsRemaining.toLocaleString()} credits remaining (${creditsPercent.toFixed(0)}%)`,
          severity: 'critical',
          category: 'platform',
          timestamp: now,
        });
      } else if (creditsPercent < 30) {
        alerts.push({
          id: `credits-warning-${platform.id}`,
          title: `${platform.displayName} Credits Low`,
          description: `${platform.creditsRemaining.toLocaleString()} credits remaining (${creditsPercent.toFixed(0)}%)`,
          severity: 'warning',
          category: 'platform',
          timestamp: now,
        });
      }
    }
  });

  // Domain alerts
  domains.forEach((domain) => {
    if (domain.status === 'blacklisted') {
      alerts.push({
        id: `domain-blacklisted-${domain.id}`,
        title: `Domain Blacklisted: ${domain.domain}`,
        description: 'Domain has been blacklisted and cannot be used for sending',
        severity: 'critical',
        category: 'domain',
        timestamp: now,
      });
    } else if (domain.healthScore < 50) {
      alerts.push({
        id: `domain-health-critical-${domain.id}`,
        title: `Domain Health Critical: ${domain.domain}`,
        description: `Health score is ${domain.healthScore}%. Consider resting this domain.`,
        severity: 'critical',
        category: 'domain',
        timestamp: now,
      });
    } else if (domain.healthScore < 70) {
      alerts.push({
        id: `domain-health-warning-${domain.id}`,
        title: `Domain Health Low: ${domain.domain}`,
        description: `Health score is ${domain.healthScore}%. Monitor closely.`,
        severity: 'warning',
        category: 'domain',
        timestamp: now,
      });
    }

    if (domain.bounceRate > 5) {
      alerts.push({
        id: `domain-bounce-${domain.id}`,
        title: `High Bounce Rate: ${domain.domain}`,
        description: `Bounce rate is ${domain.bounceRate.toFixed(1)}% (above 5% threshold)`,
        severity: 'critical',
        category: 'domain',
        timestamp: now,
      });
    }
  });

  // Capacity alerts
  if (capacity.utilizationPercent >= 95) {
    alerts.push({
      id: 'capacity-critical',
      title: 'Sending Capacity Critical',
      description: `Capacity utilization at ${capacity.utilizationPercent.toFixed(0)}%. Cannot accept new campaigns.`,
      severity: 'critical',
      category: 'capacity',
      timestamp: now,
    });
  } else if (capacity.utilizationPercent >= 85) {
    alerts.push({
      id: 'capacity-warning',
      title: 'Sending Capacity High',
      description: `Capacity utilization at ${capacity.utilizationPercent.toFixed(0)}%. Plan for additional capacity.`,
      severity: 'warning',
      category: 'capacity',
      timestamp: now,
    });
  }

  // Data quality alerts
  if (pipelineSummary && pipelineSummary.avg_validation_rate !== null) {
    if (pipelineSummary.avg_validation_rate < 80) {
      alerts.push({
        id: 'validation-rate-low',
        title: 'Low Email Validation Rate',
        description: `Average validation rate is ${pipelineSummary.avg_validation_rate.toFixed(0)}%. Check lead sources.`,
        severity: 'warning',
        category: 'data_quality',
        timestamp: now,
      });
    }
  }

  return alerts;
}

// ============================================
// Activity Feed Transformation
// ============================================

/**
 * Transform activity records to feed format
 */
export function transformActivityToFeed(activities: LeadIntelActivity[]): ActivityItem[] {
  const typeLabels: Record<string, string> = {
    import_started: 'Lead import started',
    import_completed: 'Lead import completed',
    import_failed: 'Lead import failed',
    validation_completed: 'Validation completed',
    enrichment_completed: 'Enrichment completed',
    domain_added: 'Domain added',
    domain_warming_started: 'Domain warming started',
    domain_warmed: 'Domain fully warmed',
    domain_rested: 'Domain moved to rest',
    domain_blacklisted: 'Domain blacklisted',
    domain_restored: 'Domain restored',
    domain_health_warning: 'Domain health warning',
    domain_health_critical: 'Domain health critical',
    platform_status_changed: 'Platform status changed',
    platform_rate_limited: 'Platform rate limited',
    platform_recovered: 'Platform recovered',
    credits_low: 'Credits running low',
    credits_exhausted: 'Credits exhausted',
    credits_purchased: 'Credits purchased',
    capacity_calculated: 'Capacity recalculated',
    capacity_warning: 'Capacity warning',
    capacity_critical: 'Capacity critical',
    sync_completed: 'Sync completed',
    sync_failed: 'Sync failed',
    alert_generated: 'Alert generated',
    alert_resolved: 'Alert resolved',
  };

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.activity_type,
    title: typeLabels[activity.activity_type] || activity.activity_type.replace(/_/g, ' '),
    description: activity.description || activity.source_name || undefined,
    timestamp: new Date(activity.activity_at),
  }));
}

// ============================================
// Main Data Fetcher
// ============================================

/**
 * Fetch all Lead Intelligence dashboard data
 */
export async function getLeadIntelligenceDashboardData(): Promise<LeadIntelligenceDashboardData> {
  // Fetch all data in parallel
  const [
    domains,
    domainSummary,
    leadSources,
    recentImports,
    pipelineSummary,
    capacityStatus,
    activities,
    apolloData,
    phantomData,
  ] = await Promise.all([
    getDomains(),
    getDomainSummary(),
    getLeadSources(),
    getRecentImports(5),
    getLeadPipelineSummary(),
    getCapacityStatus(),
    getLeadIntelligenceActivity(15),
    getApolloCredits(),
    getPhantomBusterStatus(),
  ]);

  // Transform data
  const domainHealthData = transformDomainsToDashboard(domains);
  const platformsData = transformSourcesToPlatforms(leadSources, apolloData, phantomData);
  const pipelineData = transformImportsToPipeline(recentImports);
  const capacityMetrics = buildCapacityMetrics(capacityStatus, domainSummary);

  // Generate alerts
  const alerts = generateLeadIntelligenceAlerts(
    platformsData,
    domainHealthData,
    capacityMetrics,
    pipelineSummary
  );

  // Calculate health score
  const health = calculateLeadIntelligenceHealth(
    platformsData,
    capacityMetrics,
    domainSummary,
    pipelineSummary,
    alerts
  );

  // Build metrics
  const metrics: LeadIntelligenceMetrics = {
    dailyEmailCapacity: {
      id: 'daily_email_capacity',
      label: 'Daily Email Capacity',
      source: 'api',
      format: 'number',
      value: capacityMetrics.totalDailyCapacity,
      target: 2000,
      status: capacityMetrics.totalDailyCapacity >= 2000 ? 'healthy' : 'warning',
    },
    capacityUtilization: {
      id: 'capacity_utilization',
      label: 'Capacity Utilization',
      source: 'api',
      format: 'percent',
      value: capacityMetrics.utilizationPercent,
      target: 85,
      status:
        capacityMetrics.utilizationPercent < 85
          ? 'healthy'
          : capacityMetrics.utilizationPercent < 95
            ? 'warning'
            : 'critical',
    },
    leadsSourcedThisWeek: {
      id: 'leads_sourced_week',
      label: 'Leads Sourced This Week',
      source: 'api',
      format: 'number',
      value: pipelineSummary?.leads_sourced_week || 0,
      target: 500,
      status: (pipelineSummary?.leads_sourced_week || 0) >= 500 ? 'healthy' : 'warning',
    },
    emailValidationRate: {
      id: 'email_validation_rate',
      label: 'Email Validation Rate',
      source: 'api',
      format: 'percent',
      value: pipelineSummary?.avg_validation_rate || 0,
      target: 90,
      status:
        (pipelineSummary?.avg_validation_rate || 0) >= 90
          ? 'healthy'
          : (pipelineSummary?.avg_validation_rate || 0) >= 80
            ? 'warning'
            : 'critical',
    },
    avgDomainHealth: {
      id: 'avg_domain_health',
      label: 'Avg Domain Health',
      source: 'api',
      format: 'number',
      value: domainSummary?.avg_active_health || 0,
      target: 85,
      status:
        (domainSummary?.avg_active_health || 0) >= 85
          ? 'healthy'
          : (domainSummary?.avg_active_health || 0) >= 70
            ? 'warning'
            : 'critical',
    },
    platformStatus: {
      id: 'platform_status',
      label: 'Platform Status',
      source: 'api',
      format: 'text',
      value: platformsData.every((p) => p.status === 'operational') ? 'All Green' : 'Issues Detected',
      status: platformsData.every((p) => p.status === 'operational') ? 'healthy' : 'warning',
    },
  };

  return {
    metrics,
    capacity: capacityMetrics,
    domains: domainHealthData,
    platforms: platformsData,
    recentImports: pipelineData,
    alerts: alerts.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      severity: a.severity,
      category: a.category,
      timestamp: a.timestamp,
      dismissable: false,
    })),
    overallHealth: health.status,
  };
}

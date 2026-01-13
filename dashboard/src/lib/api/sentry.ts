// Sentry API client for error tracking
// API docs: https://docs.sentry.io/api/

export interface SentryErrorData {
  errorRate5xx: number; // Percentage of 5xx errors
  totalErrors24h: number;
  totalRequests24h: number;
  recentIssues: SentryIssue[];
}

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  count: number;
  userCount: number;
  firstSeen: Date;
  lastSeen: Date;
  level: 'fatal' | 'error' | 'warning' | 'info';
}

interface SentryIssueResponse {
  id: string;
  title: string;
  culprit: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  level: string;
}

interface SentryStatsResponse {
  groups: Array<{
    by: { outcome: string };
    totals: { 'sum(quantity)': number };
  }>;
}

async function fetchSentry(endpoint: string) {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  if (!authToken || !org) {
    console.warn('Sentry credentials not configured');
    return null;
  }

  // Replace {org} and {project} placeholders
  const url = `https://sentry.io/api/0/${endpoint}`
    .replace('{org}', org)
    .replace('{project}', project || '');

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error('Sentry API error:', response.status, response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Sentry API fetch error:', error);
    return null;
  }
}

export async function getErrorRate(): Promise<{ errorRate: number; totalErrors: number; totalRequests: number }> {
  const org = process.env.SENTRY_ORG;
  const projectId = process.env.SENTRY_PROJECT_ID;

  if (!org || !projectId) {
    console.warn('Sentry stats requires SENTRY_PROJECT_ID (numeric ID, not slug)');
    return { errorRate: 0, totalErrors: 0, totalRequests: 0 };
  }

  // Get stats for last 24 hours - note: stats_v2 requires numeric project ID and category filter
  const stats: SentryStatsResponse | null = await fetchSentry(
    `organizations/{org}/stats_v2/?field=sum(quantity)&groupBy=outcome&category=error&project=${projectId}&statsPeriod=24h&interval=1h`
  );

  if (!stats?.groups) {
    return { errorRate: 0, totalErrors: 0, totalRequests: 0 };
  }

  let totalErrors = 0;
  let totalRequests = 0;

  stats.groups.forEach((group) => {
    const count = group.totals['sum(quantity)'] || 0;
    totalRequests += count;

    if (group.by.outcome === 'client_discard' || group.by.outcome === 'filtered') {
      // Don't count these as errors
    } else if (group.by.outcome !== 'accepted') {
      totalErrors += count;
    }
  });

  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  return {
    errorRate: Math.round(errorRate * 100) / 100,
    totalErrors,
    totalRequests,
  };
}

export async function getRecentIssues(limit: number = 10): Promise<SentryIssue[]> {
  const issues: SentryIssueResponse[] | null = await fetchSentry(
    `projects/{org}/{project}/issues/?query=is:unresolved&sort=date&limit=${limit}`
  );

  if (!issues || !Array.isArray(issues)) {
    return [];
  }

  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    culprit: issue.culprit,
    count: parseInt(issue.count, 10),
    userCount: issue.userCount,
    firstSeen: new Date(issue.firstSeen),
    lastSeen: new Date(issue.lastSeen),
    level: issue.level as SentryIssue['level'],
  }));
}

export async function getSentryErrorData(): Promise<SentryErrorData> {
  const [errorStats, recentIssues] = await Promise.all([
    getErrorRate(),
    getRecentIssues(5),
  ]);

  return {
    errorRate5xx: errorStats.errorRate,
    totalErrors24h: errorStats.totalErrors,
    totalRequests24h: errorStats.totalRequests,
    recentIssues,
  };
}

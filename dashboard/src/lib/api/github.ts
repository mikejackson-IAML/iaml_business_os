// GitHub API client for security scanning and dependency tracking
// API docs: https://docs.github.com/en/rest

export interface SecurityVulnerabilities {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface DependencyInfo {
  updatesAvailable: number;
  securityPatchesNeeded: number;
}

export interface GitHubSecurityData {
  vulnerabilities: SecurityVulnerabilities;
  dependencies: DependencyInfo;
  openIssues: {
    bugs: { critical: number; high: number; medium: number; low: number };
    total: number;
  };
}

interface DependabotAlert {
  security_vulnerability?: {
    severity: string;
  };
  state: string;
}

interface GitHubIssue {
  labels: Array<{ name: string }>;
}

async function fetchGitHub(endpoint: string) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER || 'your-org';
  const repo = process.env.GITHUB_REPO_NAME || 'your-repo';

  if (!token) {
    console.warn('GITHUB_TOKEN not configured');
    return null;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // 404 is common if Dependabot isn't enabled
      if (response.status === 404) {
        return null;
      }
      console.error('GitHub API error:', response.status, response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('GitHub API fetch error:', error);
    return null;
  }
}

export async function getSecurityVulnerabilities(): Promise<SecurityVulnerabilities> {
  const alerts = await fetchGitHub('/dependabot/alerts?state=open');

  if (!alerts || !Array.isArray(alerts)) {
    return { critical: 0, high: 0, medium: 0, low: 0 };
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  alerts.forEach((alert: DependabotAlert) => {
    const severity = alert.security_vulnerability?.severity?.toLowerCase();
    if (severity === 'critical') counts.critical++;
    else if (severity === 'high') counts.high++;
    else if (severity === 'medium') counts.medium++;
    else counts.low++;
  });

  return counts;
}

export async function getDependencyInfo(): Promise<DependencyInfo> {
  // Get all Dependabot alerts (both security and version updates)
  const alerts = await fetchGitHub('/dependabot/alerts?state=open');

  if (!alerts || !Array.isArray(alerts)) {
    return { updatesAvailable: 0, securityPatchesNeeded: 0 };
  }

  const securityPatches = alerts.filter(
    (alert: DependabotAlert) => alert.security_vulnerability
  ).length;

  // For version updates, we could also check /pulls for Dependabot PRs
  // but Dependabot alerts is the main source

  return {
    updatesAvailable: alerts.length,
    securityPatchesNeeded: securityPatches,
  };
}

export async function getOpenBugs(): Promise<{ critical: number; high: number; medium: number; low: number; total: number }> {
  // Fetch issues with 'bug' label
  const issues = await fetchGitHub('/issues?labels=bug&state=open&per_page=100');

  if (!issues || !Array.isArray(issues)) {
    return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0, total: issues.length };

  issues.forEach((issue: GitHubIssue) => {
    const labels = issue.labels.map((l) => l.name.toLowerCase());
    if (labels.includes('critical') || labels.includes('priority: critical')) {
      counts.critical++;
    } else if (labels.includes('high') || labels.includes('priority: high')) {
      counts.high++;
    } else if (labels.includes('medium') || labels.includes('priority: medium')) {
      counts.medium++;
    } else {
      counts.low++;
    }
  });

  return counts;
}

export async function getGitHubSecurityData(): Promise<GitHubSecurityData> {
  const [vulnerabilities, dependencies, openIssues] = await Promise.all([
    getSecurityVulnerabilities(),
    getDependencyInfo(),
    getOpenBugs(),
  ]);

  return {
    vulnerabilities,
    dependencies,
    openIssues: {
      bugs: {
        critical: openIssues.critical,
        high: openIssues.high,
        medium: openIssues.medium,
        low: openIssues.low,
      },
      total: openIssues.total,
    },
  };
}

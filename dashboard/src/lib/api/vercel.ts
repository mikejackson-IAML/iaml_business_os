// Vercel API client for deployments and project info
// API docs: https://vercel.com/docs/rest-api

export interface DeploymentRecord {
  id: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  createdAt: Date;
  buildingAt: Date | null;
  readyAt: Date | null;
  creator: {
    email: string;
    username: string;
  };
  meta: {
    githubCommitMessage?: string;
    githubCommitRef?: string;
    githubCommitSha?: string;
  };
}

export interface DevelopmentMetrics {
  lastDeployment: {
    timestamp: Date;
    status: 'success' | 'failed' | 'building';
    commitMessage: string;
    branch: string;
    author: string;
    url: string;
  } | null;
  buildSuccessRate30d: number;
  totalDeployments30d: number;
  failedDeployments30d: number;
}

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  buildingAt: number | null;
  ready: number | null;
  creator: {
    email: string;
    username: string;
  };
  meta: {
    githubCommitMessage?: string;
    githubCommitRef?: string;
    githubCommitSha?: string;
  };
}

interface VercelDeploymentsResponse {
  deployments?: VercelDeployment[];
}

async function fetchVercel(endpoint: string): Promise<VercelDeploymentsResponse | null> {
  const apiToken = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!apiToken) {
    console.warn('VERCEL_API_TOKEN not configured');
    return null;
  }

  const url = teamId
    ? `https://api.vercel.com${endpoint}?teamId=${teamId}`
    : `https://api.vercel.com${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error('Vercel API error:', response.status, response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Vercel API fetch error:', error);
    return null;
  }
}

export async function getDeployments(limit: number = 50): Promise<DeploymentRecord[]> {
  const data = await fetchVercel(`/v6/deployments?limit=${limit}`);

  if (!data?.deployments) {
    return [];
  }

  return data.deployments.map((d) => ({
    id: d.uid,
    name: d.name,
    url: d.url,
    state: d.state as DeploymentRecord['state'],
    createdAt: new Date(d.created),
    buildingAt: d.buildingAt ? new Date(d.buildingAt) : null,
    readyAt: d.ready ? new Date(d.ready) : null,
    creator: {
      email: d.creator?.email || '',
      username: d.creator?.username || '',
    },
    meta: {
      githubCommitMessage: d.meta?.githubCommitMessage,
      githubCommitRef: d.meta?.githubCommitRef,
      githubCommitSha: d.meta?.githubCommitSha,
    },
  }));
}

export async function getDevelopmentMetrics(): Promise<DevelopmentMetrics> {
  const deployments = await getDeployments(100);

  if (deployments.length === 0) {
    return {
      lastDeployment: null,
      buildSuccessRate30d: 100,
      totalDeployments30d: 0,
      failedDeployments30d: 0,
    };
  }

  // Get last deployment
  const lastDeploy = deployments[0];
  const lastDeployment = {
    timestamp: lastDeploy.createdAt,
    status: (lastDeploy.state === 'READY'
      ? 'success'
      : lastDeploy.state === 'ERROR'
      ? 'failed'
      : 'building') as 'success' | 'failed' | 'building',
    commitMessage: lastDeploy.meta.githubCommitMessage || 'No commit message',
    branch: lastDeploy.meta.githubCommitRef || 'main',
    author: lastDeploy.creator.username || lastDeploy.creator.email || 'Unknown',
    url: `https://${lastDeploy.url}`,
  };

  // Calculate 30-day metrics
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const deploymentsLast30d = deployments.filter((d) => d.createdAt > thirtyDaysAgo);

  const successfulDeploys = deploymentsLast30d.filter(
    (d) => d.state === 'READY'
  ).length;
  const failedDeploys = deploymentsLast30d.filter(
    (d) => d.state === 'ERROR'
  ).length;
  const totalDeploys = deploymentsLast30d.length;

  const buildSuccessRate =
    totalDeploys > 0 ? (successfulDeploys / totalDeploys) * 100 : 100;

  return {
    lastDeployment,
    buildSuccessRate30d: Math.round(buildSuccessRate * 10) / 10,
    totalDeployments30d: totalDeploys,
    failedDeployments30d: failedDeploys,
  };
}

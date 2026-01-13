// Uptime monitoring via BetterStack (formerly Better Uptime) or UptimeRobot
// API docs: https://betterstack.com/docs/uptime/api/

export interface SiteStatusData {
  isOnline: boolean;
  uptimePercent30d: number;
  avgResponseTimeMs: number;
  lastChecked: Date;
  incidentsLast24h: number;
}

export interface UptimeIncident {
  id: string;
  startedAt: Date;
  resolvedAt: Date | null;
  durationMinutes: number;
  cause: string;
}

// BetterStack API client
async function fetchBetterStack(endpoint: string) {
  const apiKey = process.env.BETTERSTACK_API_KEY;
  if (!apiKey) {
    console.warn('BETTERSTACK_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`https://uptime.betterstack.com/api/v2/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error('BetterStack API error:', response.status, response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('BetterStack API fetch error:', error);
    return null;
  }
}

// UptimeRobot API client (alternative)
async function fetchUptimeRobot(method: string, params: Record<string, string> = {}) {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.uptimerobot.com/v2/' + method, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        format: 'json',
        ...params,
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('UptimeRobot API error:', response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('UptimeRobot API fetch error:', error);
    return null;
  }
}

export async function getSiteStatus(): Promise<SiteStatusData> {
  // Try BetterStack first
  const betterStackData = await fetchBetterStack('monitors');

  if (betterStackData?.data?.length > 0) {
    const monitor = betterStackData.data[0];
    const attributes = monitor.attributes;

    return {
      isOnline: attributes.status === 'up',
      uptimePercent30d: parseFloat(attributes.uptime || '99.9'),
      avgResponseTimeMs: attributes.last_response_time || 0,
      lastChecked: new Date(attributes.last_checked_at || Date.now()),
      incidentsLast24h: 0, // Would need separate API call
    };
  }

  // Fall back to UptimeRobot
  const uptimeRobotData = await fetchUptimeRobot('getMonitors', {
    response_times: '1',
    response_times_limit: '1',
    custom_uptime_ratios: '30',
  });

  if (uptimeRobotData?.monitors?.length > 0) {
    const monitor = uptimeRobotData.monitors[0];

    return {
      isOnline: monitor.status === 2, // 2 = up in UptimeRobot
      uptimePercent30d: parseFloat(monitor.custom_uptime_ratio || '99.9'),
      avgResponseTimeMs: monitor.response_times?.[0]?.value || 0,
      lastChecked: new Date(),
      incidentsLast24h: 0,
    };
  }

  // Return defaults if no API is configured
  console.warn('No uptime monitoring API configured, returning defaults');
  return {
    isOnline: true,
    uptimePercent30d: 99.9,
    avgResponseTimeMs: 150,
    lastChecked: new Date(),
    incidentsLast24h: 0,
  };
}

export async function getRecentIncidents(hours: number = 24): Promise<UptimeIncident[]> {
  const betterStackData = await fetchBetterStack('incidents');

  if (betterStackData?.data) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return betterStackData.data
      .filter((incident: { attributes: { started_at: string } }) =>
        new Date(incident.attributes.started_at) > cutoff
      )
      .map((incident: { id: string; attributes: { started_at: string; resolved_at: string | null; cause: string } }) => ({
        id: incident.id,
        startedAt: new Date(incident.attributes.started_at),
        resolvedAt: incident.attributes.resolved_at
          ? new Date(incident.attributes.resolved_at)
          : null,
        durationMinutes: incident.attributes.resolved_at
          ? Math.round(
              (new Date(incident.attributes.resolved_at).getTime() -
                new Date(incident.attributes.started_at).getTime()) /
                60000
            )
          : 0,
        cause: incident.attributes.cause || 'Unknown',
      }));
  }

  return [];
}

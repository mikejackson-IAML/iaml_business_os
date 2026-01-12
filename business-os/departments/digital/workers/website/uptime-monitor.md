# Uptime Monitor

## Purpose
Continuously monitors website availability and response times to ensure the site is accessible to users.

## Type
Monitor (Automated)

## Schedule
Every 5 minutes (`*/5 * * * *`)

## Monitored Endpoints

| URL | Expected Status | Max Response Time |
|-----|-----------------|-------------------|
| `https://iaml.com/` | 200 | 3000ms |
| `https://iaml.com/programs/employee-relations-law` | 200 | 3000ms |
| `https://iaml.com/featured-programs` | 200 | 3000ms |
| `https://iaml.com/api/airtable-programs` | 200 | 5000ms |

## Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| 2 consecutive failures | Critical | Immediate notification |
| Response > 5000ms | Warning | Log for review |
| 5xx status code | Critical | Immediate notification |
| SSL certificate error | Critical | Immediate notification |

## Implementation

```javascript
// n8n workflow pseudo-code
const endpoints = [
  { url: 'https://iaml.com/', name: 'Homepage' },
  { url: 'https://iaml.com/featured-programs', name: 'Featured Programs' },
  { url: 'https://iaml.com/api/airtable-programs', name: 'Programs API' }
];

for (const endpoint of endpoints) {
  const start = Date.now();
  const response = await fetch(endpoint.url);
  const responseTime = Date.now() - start;

  if (!response.ok || responseTime > 5000) {
    await sendAlert({
      type: response.ok ? 'slow_response' : 'down',
      endpoint: endpoint.name,
      status: response.status,
      responseTime
    });
  }
}
```

## Data Storage

Results stored in Supabase `uptime_checks` table:
- `timestamp`
- `endpoint`
- `status_code`
- `response_time_ms`
- `success`

## Dashboard Metrics

- Current status (up/down)
- 30-day uptime percentage
- Average response time
- Incident history

# Vercel Logs Summary Command

Summarize logs from the latest deployment.

## Objective

Fetch and summarize deployment logs including:
- Build logs (success/failure, warnings)
- Function logs (errors, latency)
- Runtime logs (recent activity)

## Configuration

- **Default**: Latest production deployment
- **Options**: --prod, --preview, --deployment-id

---

## Execution Steps

### Phase 1: Get Deployment

Using Vercel MCP:

1. If `--deployment-id` provided, use that
2. If `--preview`, get latest preview deployment
3. Otherwise, get latest production deployment

### Phase 2: Fetch Build Logs

Retrieve build output:
- Build start/end times
- Build steps and durations
- Warnings during build
- Errors if build failed

### Phase 3: Fetch Function Logs

For serverless functions:
- Invocation counts (last hour/day)
- Error counts and types
- Average/P95 latency
- Memory usage

### Phase 4: Fetch Runtime Logs

Recent runtime activity:
- Request logs (last 100 or 1 hour)
- Error logs with stack traces
- Slow requests (>1s)

### Phase 5: Generate Summary

```
# Deployment Logs Summary

**Deployment**: dpl_xxxxxxxxxxxxxxxx
**URL**: https://iaml.vercel.app
**Time Range**: Last 1 hour

---

## Build Logs

**Status**: SUCCESS
**Duration**: 45 seconds

### Build Steps
| Step | Duration | Status |
|------|----------|--------|
| Installing dependencies | 12s | OK |
| Building | 28s | OK |
| Deploying | 5s | OK |

### Build Warnings (2)
1. **Deprecated API** - api/config.js
   - Using deprecated Vercel API version
   - Suggested fix: Update to v2 API

2. **Large bundle** - js/main.js
   - Bundle size: 250KB (limit: 200KB recommended)
   - Consider code splitting

### Build Errors
None

---

## Function Logs

### Last Hour Summary
| Function | Invocations | Errors | Avg Latency | P95 Latency |
|----------|-------------|--------|-------------|-------------|
| api/create-payment-intent | 15 | 0 | 234ms | 450ms |
| api/airtable-programs | 42 | 2 | 156ms | 320ms |
| api/airtable-contacts | 23 | 0 | 189ms | 280ms |
| api/ghl-webhook | 8 | 0 | 312ms | 520ms |

### Errors (2 in last hour)

**1. api/airtable-programs - 500**
- Time: 2025-12-18 14:45:12 UTC
- Error: `Rate limit exceeded`
- Request ID: req_abc123
- Duration: 1234ms

**2. api/airtable-programs - 500**
- Time: 2025-12-18 14:32:08 UTC
- Error: `AIRTABLE_API_KEY is not defined`
- Request ID: req_def456
- Duration: 45ms

---

## Runtime Logs (Last 100 requests)

### Request Distribution
| Status | Count | Percentage |
|--------|-------|------------|
| 2xx | 145 | 96.7% |
| 4xx | 3 | 2.0% |
| 5xx | 2 | 1.3% |

### Slow Requests (>1s)
| Path | Method | Duration | Time |
|------|--------|----------|------|
| /api/airtable-programs | GET | 1.2s | 14:45:12 |

### Recent Errors
| Time | Path | Status | Error |
|------|------|--------|-------|
| 14:45:12 | /api/airtable-programs | 500 | Rate limit exceeded |
| 14:32:08 | /api/airtable-programs | 500 | Missing API key |

---

## Recommendations

### Immediate Action
1. **Check Airtable API key** - Function failed with missing key error
   - Verify AIRTABLE_API_KEY in Vercel environment variables

### Monitor
1. **Rate limiting** - Airtable rate limit hit
   - Consider implementing caching
   - Review request frequency

### Optimize
1. **Bundle size warning** - Consider code splitting for main.js
2. **Slow requests** - Investigate Airtable response times

---

## Quick Actions

View full logs in Vercel dashboard:
  https://vercel.com/[team]/[project]/deployments/[deployment-id]

Re-check after fixes:
  /vercel-logs-latest
```

---

## Output Format

Display inline (no file saved).

Summary view:
```
Deployment Logs Summary
=======================
Deployment: dpl_xxxxx (production)
Time Range: Last 1 hour

Build: SUCCESS (45s) - 2 warnings
Functions: 88 invocations, 2 errors (2.3%)
Requests: 150 total, 2 errors

Top Issues:
1. [ERROR] api/airtable-programs: Rate limit exceeded
2. [WARN] Large bundle size for main.js

Full details above.
```

---

## Options

- `--prod`: Get logs from latest production (default)
- `--preview`: Get logs from latest preview
- `--deployment-id <id>`: Get logs from specific deployment
- `--time <range>`: Time range (1h, 24h, 7d)

---

## Notes

- Log retention varies by Vercel plan
- Function logs may be sampled on high-traffic deployments
- Build logs are always complete
- This is a read-only operation

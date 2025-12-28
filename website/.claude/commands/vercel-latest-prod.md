# Vercel Latest Production Deployment Command

Get information about the latest production deployment.

## Objective

Retrieve and display details of the most recent production deployment using Vercel MCP.

## Configuration

- **Target**: Production deployments only
- **Output**: Deployment URL, status, git info, build details

---

## Execution Steps

### Phase 1: Query Vercel MCP

Using Vercel MCP:

1. List deployments for the project
2. Filter to `target: production`
3. Get the most recent deployment
4. Retrieve full deployment details

### Phase 2: Collect Information

Retrieve the following:
- Deployment URL (production URL)
- Deployment ID
- Deployment status (READY, BUILDING, ERROR, etc.)
- Created timestamp
- Git commit SHA
- Git commit message
- Git branch (should be main/master)
- Build duration
- Number of serverless functions
- Regions deployed

### Phase 3: Display Results

```
# Latest Production Deployment

**URL**: https://iaml.vercel.app
**Deployment ID**: dpl_xxxxxxxxxxxxxxxx
**Status**: READY

---

## Deployment Info
| Field | Value |
|-------|-------|
| Created | 2025-12-18 14:30:00 UTC |
| Build Duration | 45 seconds |
| Functions | 9 deployed |
| Regions | iad1 (US East) |

---

## Git Info
| Field | Value |
|-------|-------|
| Commit | abc1234 |
| Message | feat: Add registration flow |
| Branch | main |
| Author | Mike <mike@example.com> |

---

## Quick Actions

To run smoke tests against this deployment:
  /deployed-smoke --prod

To view deployment logs:
  /vercel-logs-latest --prod
```

---

## Output Format

Display inline (no file saved).

Success:
```
Latest Production Deployment
============================
URL: https://iaml.vercel.app
Status: READY
Deployed: 2025-12-18 14:30:00 (2 hours ago)

Git: abc1234 - feat: Add registration flow (main)
Build: 45s | Functions: 9 | Region: iad1
```

If no production deployment:
```
No production deployment found.
Check Vercel dashboard for deployment status.
```

If deployment is building:
```
Latest Production Deployment
============================
URL: https://iaml.vercel.app
Status: BUILDING (in progress)
Started: 2025-12-18 14:30:00 (45 seconds ago)

Git: def5678 - wip: Fix registration bug

Waiting for build to complete...
```

---

## Error Handling

- **Auth error**: "Vercel MCP authentication failed. Check VERCEL_TOKEN."
- **Project not found**: "Project not found. Verify project ID in Vercel settings."
- **Rate limited**: "Vercel API rate limited. Try again in a few minutes."

---

## Notes

- This is a read-only command
- Does not trigger deployments or modify anything
- Useful for verifying current production state before running tests

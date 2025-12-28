# Vercel Latest Preview Deployment Command

Get information about the latest preview deployment.

## Objective

Retrieve and display details of the most recent preview (non-production) deployment.

## Configuration

- **Target**: Preview deployments only
- **Output**: Preview URL, status, branch info

---

## Execution Steps

### Phase 1: Query Vercel MCP

Using Vercel MCP:

1. List deployments for the project
2. Filter to `target: preview`
3. Get the most recent deployment
4. Retrieve full deployment details

### Phase 2: Collect Information

Retrieve:
- Preview URL (unique per deployment)
- Deployment ID
- Deployment status
- Created timestamp
- Git branch name
- Git commit SHA and message
- Build duration
- PR number (if from a PR)

### Phase 3: Display Results

```
# Latest Preview Deployment

**Preview URL**: https://iaml-abc123def.vercel.app
**Deployment ID**: dpl_yyyyyyyyyyyyyyyy
**Status**: READY

---

## Deployment Info
| Field | Value |
|-------|-------|
| Created | 2025-12-18 15:00:00 UTC |
| Build Duration | 42 seconds |
| Functions | 9 deployed |

---

## Git Info
| Field | Value |
|-------|-------|
| Branch | feature/new-registration |
| Commit | def5678 |
| Message | wip: Testing new registration flow |
| PR | #123 (if applicable) |

---

## Quick Actions

To run smoke tests against this preview:
  /deployed-smoke --preview

To compare with production:
  /vercel-latest-prod
```

---

## Output Format

Display inline (no file saved).

Success:
```
Latest Preview Deployment
=========================
URL: https://iaml-abc123def.vercel.app
Status: READY
Deployed: 2025-12-18 15:00:00 (30 minutes ago)

Branch: feature/new-registration
Commit: def5678 - wip: Testing new registration flow
Build: 42s | Functions: 9
```

If deployment is from a PR:
```
Latest Preview Deployment
=========================
URL: https://iaml-abc123def.vercel.app
Status: READY
PR: #123 - Add new registration flow

Branch: feature/new-registration
Commit: def5678 - feat: Add step validation
```

If no preview deployments:
```
No preview deployments found.
Push to a non-main branch to create a preview deployment.
```

---

## Use Cases

1. **Before daily registration test**: Get preview URL to test against
2. **PR review**: Check preview is ready before testing
3. **Debug**: Find URL for a specific branch deployment

---

## Notes

- Preview URLs are unique per deployment
- Multiple preview deployments can exist (one per branch/commit)
- Only shows the most recent preview deployment
- Use Vercel dashboard to see all preview deployments

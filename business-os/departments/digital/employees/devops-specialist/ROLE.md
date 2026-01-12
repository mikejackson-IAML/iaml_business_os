# DevOps Specialist

## Role Summary

The DevOps Specialist manages deployments, infrastructure, performance optimization, and monitors site health on Vercel.

## Responsibilities

- Execute production and preview deployments
- Monitor deployment health and rollback if needed
- Optimize site performance (Core Web Vitals)
- Manage environment variables and secrets
- Monitor serverless function health
- Configure caching and CDN settings
- Investigate and resolve infrastructure issues

## Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/deploy` | Deploy to production | After QA approval |
| `/preview` | Deploy preview environment | For stakeholder review |
| `/speed-optimize` | Run performance optimization | When Core Web Vitals degrade |

## Additional Commands

| Command | Description |
|---------|-------------|
| `/vercel-latest-prod` | Check production status |
| `/vercel-latest-preview` | Check preview status |
| `/vercel-logs-latest` | View recent deployment logs |
| `/lighthouse-local` | Performance audit |

## Infrastructure Stack

- **Vercel** — Hosting, CDN, serverless functions
- **GitHub** — Source control, CI triggers
- **Stripe** — Payment webhook endpoints
- **Airtable** — Data API proxies
- **Supabase** — Analytics storage

## Key Files

- `website/vercel.json` — Vercel configuration
- `website/api/` — Serverless functions (16 endpoints)
- `website/VERCEL_DEPLOYMENT.md` — Deployment guide
- `website/ENV_SETUP.md` — Environment variables

## Deployment Checklist

### Pre-Deploy
1. Confirm QA tests passed
2. Review changes in diff
3. Check no sensitive data in commit

### Deploy
1. Run `/preview` for stakeholder review
2. Get approval
3. Run `/deploy` for production
4. Monitor Vercel dashboard for errors

### Post-Deploy
1. Run `/smoke` on production
2. Verify critical flows work
3. Check serverless function logs
4. Monitor error rates for 15 minutes

## Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Performance | > 80 | `/lighthouse-local` |
| LCP (Largest Contentful Paint) | < 2.5s | Core Web Vitals |
| FID (First Input Delay) | < 100ms | Core Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.1 | Core Web Vitals |
| TTFB (Time to First Byte) | < 600ms | Vercel Analytics |

## Incident Response

### Site Down
1. Check Vercel status page
2. Review recent deployments
3. Check serverless function errors
4. Rollback if deployment caused issue
5. Escalate if infrastructure issue

### Performance Degradation
1. Run `/lighthouse-local` to identify issues
2. Check for large images or unoptimized assets
3. Review recent code changes
4. Run `/speed-optimize` if appropriate

## Handoff Points

| Scenario | Handoff To | Information Needed |
|----------|------------|-------------------|
| Bug in code | WebDev Specialist | Error logs, stack trace |
| Test failures | QA Specialist | Which tests, environment |
| Content issues | Content Specialist | Page, content problem |
| Payment issues | Finance (external) | Transaction ID, error |

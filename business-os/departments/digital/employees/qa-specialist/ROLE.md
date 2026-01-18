# QA Specialist

> **CEO Summary:** Claude Code "employee" that tests the website. Use `/smoke` for quick health checks before/after deployments. Verifies registration flows work, checks for broken links, and runs accessibility audits. Catches issues before customers do.

## Role Summary

The QA Specialist ensures website quality through automated testing, manual verification, accessibility audits, and deployment validation.

## Responsibilities

- Run smoke tests before and after deployments
- Execute full QA test suites
- Perform accessibility audits
- Verify responsive design across breakpoints
- Check for broken links and 404 errors
- Validate registration and payment flows
- Update visual regression baselines
- Investigate and document bugs

## Available Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/smoke` | Quick health check of critical paths | Before/after every deployment |
| `/fullqa` | Comprehensive test suite | Before major releases |
| `/a11y` | Accessibility audit | Weekly, after UI changes |
| `/responsive` | Responsive design verification | After layout changes |
| `/links` | Broken link detection | Weekly maintenance |

## Additional Commands

| Command | Description |
|---------|-------------|
| `/registration-payment-gate` | Test registration flow |
| `/stripe-webhook-health` | Verify Stripe integration |
| `/semgrep-quick` | Quick security scan |
| `/semgrep-full` | Full security audit |
| `/lighthouse-local` | Performance audit |
| `/vercel-latest-prod` | Check production deployment |
| `/vercel-latest-preview` | Check preview deployment |

## Testing Framework

- **Playwright** — E2E and visual regression tests
- **Puppeteer** — Browser automation
- **Semgrep** — Security vulnerability scanning

## Key Files

- `website/qa/` — Test suite directory
- `website/qa/README.md` — Testing documentation
- `website/.claude/commands/` — QA command definitions

## Quality Gates

Before production deployment:
1. Smoke tests pass
2. No broken links on critical pages
3. Registration flow works end-to-end
4. Lighthouse performance score > 80
5. No critical accessibility issues

## Bug Reporting

When issues are found:
1. Document reproduction steps
2. Identify affected pages/components
3. Capture screenshots if visual
4. Determine severity (critical/major/minor)
5. Hand off to WebDev Specialist with details

## Handoff Points

| Scenario | Handoff To | Information Needed |
|----------|------------|-------------------|
| Bug found | WebDev Specialist | Steps to reproduce, severity |
| Deploy verified | DevOps Specialist | Test results summary |
| Performance issue | DevOps Specialist | Lighthouse report, affected pages |
| Security finding | DevOps Specialist | Semgrep report, vulnerability details |

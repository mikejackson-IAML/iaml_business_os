# IAML QA Automation System

Comprehensive QA and automation commands for the IAML vanilla static website.

## Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Start Local Server

```bash
# For full functionality (including API endpoints)
vercel dev

# For static-only testing
python -m http.server 8000
```

### 3. Run QA Commands

Use Claude Code slash commands:
```
/smoke              # Basic health check
/fullqa             # Comprehensive QA suite
/registration-payment-gate   # End-to-end registration test
```

---

## Available Commands

### Local Testing (Playwright MCP)

| Command | Description | When to Use |
|---------|-------------|-------------|
| `/smoke` | Console errors, network failures, navigation | Before every commit |
| `/links` | Broken link and asset crawler | Weekly or after link changes |
| `/responsive` | Viewport screenshots (mobile, tablet, desktop) | After CSS changes |
| `/a11y` | Accessibility audit (WCAG 2.1 AA) | After HTML changes |
| `/fullqa` | All above combined | Before releases |

### Performance (Lighthouse MCP)

| Command | Description |
|---------|-------------|
| `/lighthouse-local` | Full Lighthouse audit (mobile + desktop) |
| `/perf-budget` | PASS/FAIL against thresholds (Perf≥85, A11y≥90, BP≥90, SEO≥90) |

### Security (Semgrep MCP)

| Command | Description |
|---------|-------------|
| `/semgrep-quick` | Scan changed files only (fast) |
| `/semgrep-full` | Full repository scan with triage |

### Registration Testing

| Command | Description |
|---------|-------------|
| `/gen-registration-test` | Generate/update Playwright test files |

### Deployment (Vercel MCP)

| Command | Description |
|---------|-------------|
| `/vercel-latest-prod` | Get latest production deployment info |
| `/vercel-latest-preview` | Get latest preview deployment info |
| `/vercel-logs-latest` | Summarize deployment logs |
| `/deployed-smoke` | Run smoke tests against deployed URL |

### Payments (Stripe MCP)

| Command | Description |
|---------|-------------|
| `/stripe-verify-latest-test-payment` | Verify most recent test payment |
| `/stripe-webhook-health` | Check webhook delivery status (last 24h) |
| `/registration-payment-gate` | Full registration + payment verification |

### Git/GitHub

| Command | Description |
|---------|-------------|
| `/qa-commit-summary` | Analyze diff, suggest commit message and QA commands |
| `/open-issue-from-report` | Create GitHub issue from QA report |
| `/pr-comment-qa` | Post QA summary as PR comment |

---

## Running Playwright Tests Directly

```bash
# All tests
npm run qa:full

# Registration tests only
npm run qa:registration

# Smoke tests only
npm run qa:smoke

# View HTML report
npm run qa:report
```

---

## Recommended Cadence

### Every Change
- `/smoke` - Verify no console errors
- `/links` - Check for broken links
- `/responsive` - Verify layout (if CSS changed)

### Before Commit
- `/a11y` - Verify accessibility
- `/semgrep-quick` - Security scan changed files

### Daily (Automated via GitHub Actions)
- Registration test against Vercel Preview
- Stripe payment verification
- Production smoke test
- Stripe webhook health check

### Pre-Release
- `/fullqa` - Comprehensive QA
- `/lighthouse-local` - Performance audit
- `/perf-budget` - Verify thresholds met
- `/semgrep-full` - Full security scan

---

## Directory Structure

```
qa/
├── README.md           # This file
├── reports/            # Generated reports (gitignored)
│   └── .gitkeep
├── screenshots/        # Captured screenshots (gitignored)
│   └── .gitkeep
├── tests/              # Playwright test files
│   ├── registration.spec.js
│   ├── smoke.spec.js
│   └── helpers/
│       └── test-utils.js
└── scripts/            # Helper scripts
```

---

## GitHub Actions

Two automated workflows run daily:

### Daily Preview Registration Test
- **Schedule**: 6 AM UTC (10 PM PST)
- **What it does**:
  1. Gets latest Vercel preview URL
  2. Runs registration tests with Stripe test payment
  3. Verifies payment in Stripe
  4. Uploads artifacts on failure

### Daily Production Health Check
- **Schedule**: 7 AM UTC (11 PM PST)
- **What it does**:
  1. Runs smoke tests against production
  2. Checks API endpoint health
  3. Verifies Stripe webhook status
  4. Uploads artifacts on failure

### Required Secrets

Add these to GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `STRIPE_TEST_SECRET_KEY` | Stripe test mode secret key |
| `STRIPE_SECRET_KEY` | Stripe secret key (for webhook health) |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `playwright.config.js` | Playwright test configuration |
| `.semgrepignore` | Files to exclude from security scans |
| `package.json` | npm scripts and dependencies |

---

## Troubleshooting

### Port 3000 in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 vercel dev
```

### Flaky Lighthouse scores
- Lighthouse scores can vary ±5 points between runs
- Run 3 times and take median for critical decisions
- Use `--repeat=3` in CI for reliability

### Selector stability
- Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
- Add `data-testid` attributes for critical elements
- Use `page.waitForSelector` before interacting

### Stripe test mode
- Always use test card: `4242 4242 4242 4242`
- Test email pattern: `test+YYYYMMDDHHMM@local.dev`
- Verify STRIPE_PUBLISHABLE_KEY starts with `pk_test_`

### Vercel preview vs production
- Preview URLs are unique per deployment
- Use `/vercel-latest-preview` to get current URL
- API endpoints may have different env vars

### Registration tests timing out
- Stripe confirmation can take up to 60 seconds
- Ensure `vercel dev` is running (not static server)
- Check browser console for API errors

---

## Test Data

### Test Emails
All tests use the pattern: `test+YYYYMMDDHHMM@local.dev`

This allows:
- Easy identification of test data
- Cleanup by email pattern
- Unique emails for each test run

### Test Cards
| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Succeeds |
| 4000 0000 0000 0002 | Declines |
| 4000 0000 0000 3220 | Requires 3D Secure |

### Cleanup
Test data created:
- Airtable: Contacts, Companies, Registrations with test emails
- Stripe: Customers, PaymentIntents in test mode

Consider periodic cleanup of test data in staging environments.

---

## Writing New Tests

### Test File Location
Place new tests in `qa/tests/` with `.spec.js` extension.

### Using Test Utilities
```javascript
const {
  generateTestEmail,
  setupErrorCapture,
  assertNoErrors,
  waitForPageLoad,
  TEST_DATA
} = require('./helpers/test-utils');
```

### Best Practices
1. Use `setupErrorCapture` to catch console/network errors
2. Use `waitForPageLoad` after navigation
3. Use resilient selectors (getByRole, getByLabel, getByText)
4. Add timeouts for async operations
5. Take screenshots on failure (automatic via config)

---

## Reports

Reports are saved to `qa/reports/` (gitignored).

### Report Types
- `smoke-YYYYMMDD-HHMMSS.md` - Smoke test results
- `links-YYYYMMDD-HHMMSS.md` - Broken link report
- `responsive-YYYYMMDD-HHMMSS.md` - Responsive test results
- `a11y-YYYYMMDD-HHMMSS.md` - Accessibility audit
- `fullqa-YYYYMMDD-HHMMSS/` - Complete QA suite (folder)
- `lighthouse-YYYYMMDD-HHMMSS.md` - Lighthouse summary
- `semgrep-full-YYYYMMDD-HHMMSS.md` - Security scan results

### Screenshots
Screenshots are saved to `qa/screenshots/` (gitignored).

Organized by command:
- `smoke/` - Page screenshots from smoke tests
- `responsive/` - Viewport screenshots
- `a11y/` - Accessibility-related screenshots
- `deployed/` - Screenshots from deployed tests

---

## Guardrails

These rules are enforced across all commands:

1. **Same-origin rule**: Local commands never leave localhost:3000
2. **Hard reload**: Cache is cleared before each check
3. **Minimal output**: Reports are concise, no full HTML dumps
4. **Test mode only**: Stripe commands never touch production
5. **No secrets committed**: Use env vars and GitHub Secrets

---

## Getting Help

- Check this README first
- Review command-specific `.md` files in `.claude/commands/`
- Check Playwright docs: https://playwright.dev/docs
- File issues: https://github.com/anthropics/claude-code/issues

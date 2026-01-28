# Phase 12: Migration & Cleanup - Research

**Researched:** 2026-01-28
**Domain:** Data migration, code cleanup, E2E testing, API documentation
**Confidence:** HIGH

## Summary

This phase involves four distinct workstreams: (1) migrating existing dev_projects data into the planning_studio schema, (2) removing the old Development Dashboard code, (3) creating API documentation, and (4) establishing E2E tests with performance benchmarks.

The migration is straightforward as both schemas share similar concepts (projects with phases, statuses, timestamps). The old Development Dashboard consists of 11 files across 3 directories that need removal. Playwright is the recommended E2E framework given existing usage in the website folder. Next.js 16 (current version) supports redirects in next.config.ts for the /dashboard/development to /dashboard/planning redirect.

**Primary recommendation:** Build an interactive migration UI as a one-time-use component within Planning Studio, implement redirects via next.config.ts, use Playwright for E2E with Navigation Timing API for performance benchmarks.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | 1.50+ | E2E testing | Already used in website folder, best-in-class auto-waiting |
| Next.js redirects | built-in | Route redirects | Native solution, no middleware complexity |
| Navigation Timing API | browser API | Performance metrics | Standard browser API, no dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @playwright/test | 1.50+ | Test runner | E2E test execution |
| playwright-performance | npm package | Performance assertions | If need structured perf checks |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Playwright has better multi-browser, async support |
| next.config redirects | middleware.ts | Middleware adds complexity for simple redirects |
| Migration UI | CLI script | UI allows selective migration, better UX |

**Installation:**
```bash
cd dashboard && npm install -D @playwright/test
npx playwright install chromium
```

## Architecture Patterns

### Migration Component Structure
```
dashboard/src/app/dashboard/planning/migrate/
├── page.tsx                  # Migration UI page
├── migrate-content.tsx       # Migration selection interface
├── components/
│   ├── project-selector.tsx  # Checkbox list of old projects
│   ├── migration-preview.tsx # Show what will be created
│   └── migration-status.tsx  # Progress/completion display
└── actions.ts                # Server actions for migration
```

### E2E Test Structure
```
dashboard/e2e/
├── playwright.config.ts
├── tests/
│   ├── planning/
│   │   ├── capture.spec.ts       # Create project flow
│   │   ├── phases.spec.ts        # Phase navigation
│   │   ├── documents.spec.ts     # Document CRUD
│   │   ├── queue.spec.ts         # Build queue
│   │   └── analytics.spec.ts     # Analytics page
│   ├── migration/
│   │   └── verify-migration.spec.ts
│   └── performance/
│       └── page-load.spec.ts
├── fixtures/
│   └── test-data.ts             # Seed data for tests
└── page-objects/
    ├── planning-page.ts
    ├── project-detail-page.ts
    └── queue-page.ts
```

### Pattern 1: Data Migration with Status Mapping
**What:** Map old dev_projects statuses to Planning Studio statuses
**When to use:** During migration script execution
**Mapping:**
```typescript
// Source: Analysis of both schemas
const STATUS_MAP: Record<string, { status: string; phase: string }> = {
  'idle': { status: 'idea', phase: 'capture' },
  'executing': { status: 'planning', phase: 'discover' },
  'needs_input': { status: 'planning', phase: 'discover' },
  'blocked': { status: 'planning', phase: 'discover' },
  'complete': { status: 'shipped', phase: 'package' },
};
```

### Pattern 2: Playwright Page Object Model
**What:** Encapsulate page interactions in reusable classes
**When to use:** All E2E tests for maintainability
**Example:**
```typescript
// Source: Playwright best practices docs
export class PlanningPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/dashboard/planning');
  }

  async captureIdea(title: string, oneLiner?: string) {
    await this.page.getByRole('button', { name: 'Capture Idea' }).click();
    await this.page.getByLabel('Title').fill(title);
    if (oneLiner) {
      await this.page.getByLabel('One-liner').fill(oneLiner);
    }
    await this.page.getByRole('button', { name: 'Create' }).click();
  }

  async getProjectCards() {
    return this.page.locator('[data-testid="project-card"]').all();
  }
}
```

### Pattern 3: Performance Measurement in Playwright
**What:** Capture page load metrics via Navigation Timing API
**When to use:** Performance benchmark tests
**Example:**
```typescript
// Source: https://www.checklyhq.com/docs/learn/playwright/performance/
test('page loads under 1 second', async ({ page }) => {
  await page.goto('/dashboard/planning');

  const timing = await page.evaluate(() => {
    const perf = window.performance.timing;
    return {
      domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
      load: perf.loadEventEnd - perf.navigationStart,
    };
  });

  expect(timing.domContentLoaded).toBeLessThan(1000);
});
```

### Anti-Patterns to Avoid
- **Hard-coded selectors:** Use role-based or data-testid selectors, not CSS classes
- **Synchronous waits:** Never use `page.waitForTimeout()`, use auto-waiting locators
- **Test interdependence:** Each test should be fully isolated with its own data
- **Testing in dev mode:** Always test against production build for accurate performance

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| E2E testing | Custom test runner | Playwright | Auto-waiting, trace viewer, parallel execution |
| Performance metrics | Manual timing code | Navigation Timing API | Browser standard, comprehensive |
| Redirects | Custom middleware | next.config.ts redirects | Native, zero runtime cost |
| Test data seeding | Manual SQL scripts | Supabase client in fixtures | Type-safe, consistent cleanup |

**Key insight:** This phase is mostly glue code and configuration. The complex parts (testing framework, redirect handling, performance APIs) are already solved by platform features.

## Common Pitfalls

### Pitfall 1: Testing Development Server
**What goes wrong:** Flaky tests, misleading performance numbers
**Why it happens:** Dev server has hot reload, debug logging, no optimization
**How to avoid:** Always run `npm run build && npm run start` before E2E tests
**Warning signs:** Tests pass locally but fail in CI, inconsistent timing

### Pitfall 2: Migration Without Validation
**What goes wrong:** Silent data loss or corruption during migration
**Why it happens:** Missing validation between old and new data shapes
**How to avoid:**
1. Preview migration results before committing
2. Keep old data in place (don't delete tables)
3. Add verification step that queries both schemas
**Warning signs:** Row counts don't match, missing relationships

### Pitfall 3: Unstable Selectors
**What goes wrong:** Tests break when UI changes
**Why it happens:** Using CSS classes or DOM structure as selectors
**How to avoid:** Use data-testid attributes and role-based selectors
**Warning signs:** Tests break after styling changes

### Pitfall 4: Missing Test Isolation
**What goes wrong:** Tests pass individually but fail when run together
**Why it happens:** Shared state from previous tests
**How to avoid:** Fresh browser context per test, seed and cleanup data
**Warning signs:** Test order matters, parallel execution fails

### Pitfall 5: Performance Test Variance
**What goes wrong:** Performance tests are flaky due to timing variance
**Why it happens:** Network, CPU, and browser variations
**How to avoid:**
1. Run multiple iterations and use P95/median
2. Use generous thresholds (e.g., 1s not 500ms)
3. Mock network requests for consistent results
**Warning signs:** Same test passes and fails randomly

## Code Examples

### Migration Server Action
```typescript
// Source: Supabase schema analysis + Next.js server actions
// dashboard/src/app/dashboard/planning/migrate/actions.ts

'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface MigrationResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

export async function migrateProject(oldProjectId: string): Promise<MigrationResult> {
  const supabase = createServerClient();

  // Fetch old project data
  const { data: oldProject, error: fetchError } = await supabase
    .from('dev_projects')
    .select('*')
    .eq('id', oldProjectId)
    .single();

  if (fetchError || !oldProject) {
    return { success: false, error: 'Project not found' };
  }

  // Map status to Planning Studio equivalent
  const statusMap: Record<string, { status: string; phase: string }> = {
    'idle': { status: 'idea', phase: 'capture' },
    'executing': { status: 'planning', phase: 'discover' },
    'needs_input': { status: 'planning', phase: 'discover' },
    'blocked': { status: 'planning', phase: 'discover' },
    'complete': { status: 'shipped', phase: 'package' },
  };

  const mapped = statusMap[oldProject.status] || { status: 'idea', phase: 'capture' };

  // Create new project
  const { data: newProject, error: createError } = await supabase
    .schema('planning_studio')
    .from('projects')
    .insert({
      title: oldProject.project_name,
      one_liner: oldProject.description,
      status: mapped.status,
      current_phase: mapped.phase,
      created_at: oldProject.created_at,
      shipped_at: oldProject.status === 'complete' ? oldProject.completed_at : null,
    })
    .select()
    .single();

  if (createError) {
    return { success: false, error: createError.message };
  }

  revalidatePath('/dashboard/planning');
  return { success: true, projectId: newProject.id };
}

export async function getOldProjects() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('dev_projects')
    .select('id, project_key, project_name, description, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching old projects:', error);
    return [];
  }

  return data || [];
}
```

### Next.js Redirect Configuration
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects
// dashboard/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/dashboard/development',
        destination: '/dashboard/planning',
        permanent: true, // 308 redirect (cached by browsers)
      },
      {
        source: '/dashboard/development/:path*',
        destination: '/dashboard/planning',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

### Playwright Configuration
```typescript
// Source: https://nextjs.org/docs/pages/guides/testing/playwright
// dashboard/playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### E2E Test Example
```typescript
// Source: Playwright docs + Page Object Model pattern
// dashboard/e2e/tests/planning/capture.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Capture Idea Flow', () => {
  test('can create a new project via capture modal', async ({ page }) => {
    await page.goto('/dashboard/planning');

    // Open capture modal
    await page.getByRole('button', { name: /capture/i }).click();

    // Fill form
    await page.getByLabel('Title').fill('Test Project');
    await page.getByLabel('One-liner').fill('A test project for E2E');

    // Submit
    await page.getByRole('button', { name: /create/i }).click();

    // Verify project appears in Ideas column
    await expect(page.locator('[data-testid="column-idea"]'))
      .toContainText('Test Project');
  });

  test('displays validation error for empty title', async ({ page }) => {
    await page.goto('/dashboard/planning');
    await page.getByRole('button', { name: /capture/i }).click();
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText(/title is required/i)).toBeVisible();
  });
});
```

### Performance Test Example
```typescript
// Source: https://www.checklyhq.com/docs/learn/playwright/performance/
// dashboard/e2e/tests/performance/page-load.spec.ts

import { test, expect } from '@playwright/test';

const LOAD_TIME_THRESHOLD = 1000; // 1 second target

test.describe('Page Load Performance', () => {
  const pages = [
    { name: 'Pipeline', path: '/dashboard/planning' },
    { name: 'Queue', path: '/dashboard/planning/queue' },
    { name: 'Goals', path: '/dashboard/planning/goals' },
    { name: 'Analytics', path: '/dashboard/planning/analytics' },
  ];

  for (const { name, path } of pages) {
    test(`${name} page loads under ${LOAD_TIME_THRESHOLD}ms`, async ({ page }) => {
      const startTime = Date.now();

      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      console.log(`${name} page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(LOAD_TIME_THRESHOLD);
    });
  }

  test('captures detailed timing metrics', async ({ page }) => {
    await page.goto('/dashboard/planning');

    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        dns: perf.domainLookupEnd - perf.domainLookupStart,
        tcp: perf.connectEnd - perf.connectStart,
        ttfb: perf.responseStart - perf.requestStart,
        domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
        load: perf.loadEventEnd - perf.navigationStart,
      };
    });

    console.log('Performance metrics:', metrics);

    // Assert on key metrics
    expect(metrics.domContentLoaded).toBeLessThan(LOAD_TIME_THRESHOLD);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cypress for E2E | Playwright | 2024 | Better auto-waiting, parallel execution |
| middleware.ts for redirects | next.config.ts redirects | Next.js 12+ | Simpler, no runtime cost |
| Manual timing code | Navigation Timing API | Browser standard | More accurate, comprehensive |
| Custom test data setup | Playwright fixtures | Playwright 1.18+ | Better isolation, reusability |

**Deprecated/outdated:**
- Cypress (still works but Playwright is preferred for new projects)
- `performance.timing` (use `performance.getEntriesByType('navigation')` instead)

## Open Questions

1. **Authentication in E2E tests**
   - What we know: Dashboard likely has auth
   - What's unclear: How to handle auth state in tests
   - Recommendation: Use Playwright's `storageState` to save logged-in session, reuse across tests

2. **Test data cleanup**
   - What we know: Tests will create data in planning_studio schema
   - What's unclear: Best cleanup strategy (delete after each test vs. dedicated test database)
   - Recommendation: Use unique test prefixes (e.g., `[E2E] Test Project`) and cleanup via beforeAll/afterAll

## Sources

### Primary (HIGH confidence)
- Next.js official docs - redirects configuration: https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects
- Playwright official docs - Next.js integration: https://nextjs.org/docs/pages/guides/testing/playwright
- Codebase analysis - dev_projects schema and Planning Studio schema

### Secondary (MEDIUM confidence)
- BrowserStack Playwright best practices: https://www.browserstack.com/guide/playwright-best-practices
- Checkly performance testing guide: https://www.checklyhq.com/docs/learn/playwright/performance/

### Tertiary (LOW confidence)
- Web search results for 2026 patterns (verify with official docs before implementing)

## Files to Remove (Old Development Dashboard)

Based on codebase analysis, the following files comprise the old Development Dashboard:

### Route Files
| File | Lines | Purpose |
|------|-------|---------|
| `dashboard/src/app/dashboard/development/page.tsx` | 21 | Page entry |
| `dashboard/src/app/dashboard/development/development-content.tsx` | 205 | Main content |
| `dashboard/src/app/dashboard/development/development-skeleton.tsx` | ~50 | Loading state |

### Components
| File | Purpose |
|------|---------|
| `dashboard/src/app/dashboard/development/components/ideas-backlog.tsx` | Ideas management |
| `dashboard/src/app/dashboard/development/components/launch-modal.tsx` | Launch command modal |
| `dashboard/src/app/dashboard/development/components/project-card.tsx` | Project display |
| `dashboard/src/app/dashboard/development/components/roadmap-view.tsx` | Roadmap visualization |

### Types and API
| File | Purpose |
|------|---------|
| `dashboard/src/dashboard-kit/types/departments/development.ts` | TypeScript types |
| `dashboard/src/lib/api/development-queries.ts` | Supabase queries |

**Total: 9 files to delete** (plus the components directory itself)

## Database Tables (Keep But Stop Using)

Per user decision, these tables remain in place:
- `dev_projects` - Main projects table
- `dev_project_phases` - Phase tracking
- `dev_project_ideas` - Ideas backlog
- `dev_project_summary` (view)
- `dev_projects_needing_attention` (view)

## Metadata

**Confidence breakdown:**
- Migration mapping: HIGH - Both schemas analyzed, mapping is straightforward
- Code removal: HIGH - All files identified via glob search
- E2E patterns: HIGH - Official Playwright docs verified
- Performance testing: MEDIUM - Best practices consolidated from multiple sources

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable domain)

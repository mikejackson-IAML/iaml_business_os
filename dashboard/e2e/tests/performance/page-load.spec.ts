import { test, expect } from '@playwright/test';

// Target from CONTEXT.md: page loads < 1 second
const LOAD_TIME_THRESHOLD_MS = 1000;

// Pages to test
const PLANNING_PAGES = [
  { name: 'Pipeline', path: '/dashboard/planning' },
  { name: 'Queue', path: '/dashboard/planning/queue' },
  { name: 'Goals', path: '/dashboard/planning/goals' },
  { name: 'Analytics', path: '/dashboard/planning/analytics' },
  { name: 'Migration', path: '/dashboard/planning/migrate' },
];

test.describe('Planning Studio Performance', () => {
  // Run performance tests serially to avoid resource contention
  test.describe.configure({ mode: 'serial' });

  for (const { name, path } of PLANNING_PAGES) {
    test(`${name} page loads under ${LOAD_TIME_THRESHOLD_MS}ms`, async ({ page }) => {
      const startTime = Date.now();

      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      console.log(`  ${name} page: ${loadTime}ms`);

      expect(loadTime, `${name} page took ${loadTime}ms (threshold: ${LOAD_TIME_THRESHOLD_MS}ms)`).toBeLessThan(LOAD_TIME_THRESHOLD_MS);
    });
  }

  test('captures detailed Navigation Timing metrics', async ({ page }) => {
    await page.goto('/dashboard/planning');
    await page.waitForLoadState('load');

    const metrics = await page.evaluate(() => {
      const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        // DNS lookup
        dns: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
        // TCP connection
        tcp: Math.round(entry.connectEnd - entry.connectStart),
        // Time to first byte
        ttfb: Math.round(entry.responseStart - entry.requestStart),
        // DOM content loaded
        domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.navigationStart),
        // Full page load
        load: Math.round(entry.loadEventEnd - entry.navigationStart),
        // DOM interactive
        domInteractive: Math.round(entry.domInteractive - entry.navigationStart),
      };
    });

    console.log('\n  Performance Metrics:');
    console.log(`    DNS lookup:        ${metrics.dns}ms`);
    console.log(`    TCP connection:    ${metrics.tcp}ms`);
    console.log(`    Time to first byte: ${metrics.ttfb}ms`);
    console.log(`    DOM interactive:   ${metrics.domInteractive}ms`);
    console.log(`    DOM content loaded: ${metrics.domContentLoaded}ms`);
    console.log(`    Full page load:    ${metrics.load}ms`);

    // Key metric: DOM content loaded should be under threshold
    expect(metrics.domContentLoaded, `DOM content loaded took ${metrics.domContentLoaded}ms`).toBeLessThan(LOAD_TIME_THRESHOLD_MS);
  });

  test('project detail page loads under threshold', async ({ page }) => {
    // First, get a project ID from the pipeline
    await page.goto('/dashboard/planning');
    await page.waitForLoadState('domcontentloaded');

    // Get first project link
    const projectLink = page.locator('[data-testid="project-card"] a').first();
    const href = await projectLink.getAttribute('href');

    if (href) {
      const startTime = Date.now();
      await page.goto(href);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      console.log(`  Project Detail page: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(LOAD_TIME_THRESHOLD_MS);
    } else {
      console.log('  No projects available for detail page test');
    }
  });

  test('page load stability (multiple runs)', async ({ page }) => {
    const runs = 3;
    const loadTimes: number[] = [];

    for (let i = 0; i < runs; i++) {
      // Clear cache
      await page.context().clearCookies();

      const startTime = Date.now();
      await page.goto('/dashboard/planning');
      await page.waitForLoadState('domcontentloaded');
      loadTimes.push(Date.now() - startTime);
    }

    const avg = Math.round(loadTimes.reduce((a, b) => a + b, 0) / runs);
    const max = Math.max(...loadTimes);
    const min = Math.min(...loadTimes);

    console.log(`\n  Load time stability (${runs} runs):`);
    console.log(`    Min: ${min}ms`);
    console.log(`    Max: ${max}ms`);
    console.log(`    Avg: ${avg}ms`);
    console.log(`    Variance: ${max - min}ms`);

    // Average should be under threshold
    expect(avg, `Average load time ${avg}ms exceeds threshold`).toBeLessThan(LOAD_TIME_THRESHOLD_MS);

    // Max should not be too far above (allow 50% buffer for variance)
    expect(max, `Max load time ${max}ms exceeds buffer`).toBeLessThan(LOAD_TIME_THRESHOLD_MS * 1.5);
  });
});

// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for IAML QA tests
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './qa/tests',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL for tests - vercel dev runs on port 3000 */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on first retry */
    video: 'on-first-retry',

    /* Default timeout for actions */
    actionTimeout: 10000,

    /* Default navigation timeout */
    navigationTimeout: 30000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  /* Run local dev server before tests if not CI and no BASE_URL provided */
  webServer: (process.env.CI || process.env.BASE_URL) ? undefined : {
    command: 'vercel dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000
  },

  /* Global timeout for each test */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
    /* Visual comparison settings */
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled'
    }
  },

  /* Snapshot path template */
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}'
});

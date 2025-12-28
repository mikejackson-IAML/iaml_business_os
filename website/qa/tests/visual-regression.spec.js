// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual Regression Tests for IAML Website
 *
 * These tests capture screenshots of all pages and compare them against baselines.
 * Run `npx playwright test visual-regression --update-snapshots` to update baselines.
 *
 * IMPORTANT: Run this before and after CSS changes to catch regressions.
 */

// All pages to test (add new pages here as they're created)
const PAGES = [
  // Homepage
  { name: 'homepage', path: '/' },

  // Pages folder
  { name: 'about-us', path: '/pages/about-us.html' },
  { name: 'featured-programs', path: '/pages/featured-programs.html' },
  { name: 'corporate-training', path: '/pages/corporate-training.html' },
  { name: 'faculty', path: '/pages/faculty.html' },
  { name: 'program-schedule', path: '/pages/program-schedule.html' },

  // Program pages
  { name: 'program-employee-relations-law', path: '/programs/employee-relations-law.html' },
  { name: 'program-strategic-hr-leadership', path: '/programs/strategic-hr-leadership.html' }
];

// Viewports to test
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];

test.describe('Visual Regression Tests', () => {

  for (const page of PAGES) {
    for (const viewport of VIEWPORTS) {

      test(`${page.name} - ${viewport.name}`, async ({ page: browserPage }) => {
        // Set viewport
        await browserPage.setViewportSize({
          width: viewport.width,
          height: viewport.height
        });

        // Navigate to page
        await browserPage.goto(page.path, { waitUntil: 'networkidle' });

        // Wait for fonts to load
        await browserPage.waitForFunction(() => document.fonts.ready);

        // Wait for any animations to settle
        await browserPage.waitForTimeout(500);

        // Hide dynamic content that changes between runs
        await browserPage.evaluate(() => {
          // Hide date/time elements
          document.querySelectorAll('[data-dynamic], .loading-spinner').forEach(el => {
            el.style.visibility = 'hidden';
          });
        });

        // Take full page screenshot
        await expect(browserPage).toHaveScreenshot(
          `${page.name}-${viewport.name}.png`,
          {
            fullPage: true,
            maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
            threshold: 0.2, // Color difference threshold
            animations: 'disabled'
          }
        );
      });

    }
  }

});

test.describe('Critical Component Screenshots', () => {

  test('Header - all states', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Desktop header
    await page.setViewportSize({ width: 1440, height: 900 });
    const header = page.locator('header.header');
    await expect(header).toHaveScreenshot('header-desktop.png');

    // Mobile header
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(header).toHaveScreenshot('header-mobile.png');

    // Mobile menu open
    await page.click('#hamburger');
    await page.waitForTimeout(300);
    await expect(page.locator('.mobile-menu')).toHaveScreenshot('mobile-menu-open.png');
  });

  test('Footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('footer.png');
  });

  test('Glass buttons', async ({ page }) => {
    await page.goto('/pages/about-us.html');
    await page.waitForLoadState('networkidle');

    // Capture hero buttons
    const buttonContainer = page.locator('.about-button-container').first();
    await expect(buttonContainer).toHaveScreenshot('glass-buttons.png');
  });

  test('Benefit cards', async ({ page }) => {
    await page.goto('/pages/corporate-training.html');
    await page.waitForLoadState('networkidle');

    const benefitCard = page.locator('.ct-benefit-card').first();
    await expect(benefitCard).toHaveScreenshot('benefit-card.png');
  });

});

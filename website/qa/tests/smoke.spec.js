// @ts-check
const { test, expect } = require('@playwright/test');
const { setupErrorCapture, assertNoErrors, waitForPageLoad } = require('./helpers/test-utils');

/**
 * Pages to test in smoke tests
 * These cover the main entry points and critical paths
 */
const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/register.html', name: 'Registration' },
  { path: '/about-us', name: 'About Us' },
  { path: '/featured-programs', name: 'Featured Programs' },
  { path: '/faculty', name: 'Faculty' },
  { path: '/programs/employee-relations-law.html', name: 'Program Page' }
];

test.describe('Smoke Tests', () => {

  test.describe('Page Load Tests', () => {
    for (const { path, name } of PAGES) {
      test(`${name} (${path}) loads without errors`, async ({ page }) => {
        const errors = setupErrorCapture(page);

        await page.goto(path);
        await waitForPageLoad(page);

        // Check page has content
        await expect(page.locator('body')).not.toBeEmpty();

        // Check page has main content area
        await expect(page.locator('main, [role="main"], .main-content, #main')).toBeVisible();

        // Check no critical errors
        assertNoErrors(errors, `loading ${path}`);
      });
    }
  });

  test.describe('Navigation Tests', () => {

    test('main navigation links work', async ({ page }) => {
      const errors = setupErrorCapture(page);

      await page.goto('/');
      await waitForPageLoad(page);

      // Find nav links
      const navLinks = page.locator('nav a[href^="/"], header a[href^="/"]');
      const linkCount = await navLinks.count();

      expect(linkCount, 'Should have navigation links').toBeGreaterThan(0);

      // Test up to 5 nav links
      const linksToTest = Math.min(5, linkCount);

      for (let i = 0; i < linksToTest; i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');

        if (href && href.startsWith('/') && !href.startsWith('//') && !href.includes('#')) {
          const linkText = await link.textContent();
          console.log(`Testing nav link: ${linkText?.trim()} -> ${href}`);

          await link.click();
          await waitForPageLoad(page);

          // Verify we navigated
          const currentUrl = page.url();
          expect(currentUrl, `Should navigate to ${href}`).toContain(href.split('#')[0]);

          // Go back for next iteration
          await page.goto('/');
          await waitForPageLoad(page);
        }
      }

      assertNoErrors(errors, 'navigation testing');
    });

    test('footer links are valid', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Find footer links
      const footerLinks = page.locator('footer a[href^="/"]');
      const linkCount = await footerLinks.count();

      console.log(`Found ${linkCount} footer links`);

      // Just verify links exist and have valid hrefs
      for (let i = 0; i < linkCount; i++) {
        const link = footerLinks.nth(i);
        const href = await link.getAttribute('href');

        expect(href, 'Footer link should have href').toBeTruthy();
        expect(href, 'Footer link should be valid path').not.toBe('#');
      }
    });
  });

  test.describe('Critical Elements', () => {

    test('homepage has required sections', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Check for header
      await expect(page.locator('header, [role="banner"]')).toBeVisible();

      // Check for main content
      await expect(page.locator('main, [role="main"]')).toBeVisible();

      // Check for footer
      await expect(page.locator('footer, [role="contentinfo"]')).toBeVisible();

      // Check for navigation
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    });

    test('registration page has form elements', async ({ page }) => {
      await page.goto('/register.html');
      await waitForPageLoad(page);

      // Check for form
      await expect(page.locator('form, [role="form"], .registration-form')).toBeVisible();

      // Check for format selection (first step)
      const formatOptions = page.locator('[data-format], .format-option, input[name="format"]');
      const hasFormatOptions = await formatOptions.count() > 0;
      expect(hasFormatOptions, 'Should have format options').toBeTruthy();
    });

    test('program page has curriculum section', async ({ page }) => {
      await page.goto('/programs/employee-relations-law.html');
      await waitForPageLoad(page);

      // Check for curriculum or program details
      const hasContent = await page.locator('.curriculum, .program-details, .course-content, [class*="curriculum"]').count() > 0;
      expect(hasContent, 'Should have program content').toBeTruthy();
    });
  });

  test.describe('Responsive Header', () => {

    test('mobile menu toggle works', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto('/');
      await waitForPageLoad(page);

      // Look for mobile menu toggle
      const menuToggle = page.locator('[class*="menu-toggle"], [class*="hamburger"], button[aria-label*="menu"], .mobile-menu-btn');

      if (await menuToggle.isVisible()) {
        // Click to open
        await menuToggle.click();
        await page.waitForTimeout(300);

        // Check if menu is visible
        const mobileMenu = page.locator('[class*="mobile-menu"], [class*="nav-menu"], nav.open, .menu-open');
        const isMenuVisible = await mobileMenu.isVisible();

        // Menu should be visible after click
        expect(isMenuVisible, 'Mobile menu should open').toBeTruthy();

        // Click to close
        await menuToggle.click();
        await page.waitForTimeout(300);
      } else {
        console.log('No mobile menu toggle found (might be CSS-based)');
      }
    });
  });

  test.describe('External Resources', () => {

    test('critical CSS loads', async ({ page }) => {
      const cssLoaded = [];

      page.on('response', response => {
        if (response.url().includes('.css') && response.status() === 200) {
          cssLoaded.push(response.url());
        }
      });

      await page.goto('/');
      await waitForPageLoad(page);

      expect(cssLoaded.length, 'Should load CSS files').toBeGreaterThan(0);
      console.log(`Loaded ${cssLoaded.length} CSS files`);
    });

    test('critical JS loads', async ({ page }) => {
      const jsLoaded = [];

      page.on('response', response => {
        if (response.url().includes('.js') && response.status() === 200) {
          jsLoaded.push(response.url());
        }
      });

      await page.goto('/');
      await waitForPageLoad(page);

      expect(jsLoaded.length, 'Should load JS files').toBeGreaterThan(0);
      console.log(`Loaded ${jsLoaded.length} JS files`);
    });
  });
});

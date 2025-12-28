# Generate Registration Test Command

Generate a Playwright test file for the complete registration flow.

## Objective

Create `qa/tests/registration.spec.js` with tests that:
- Navigate through all registration steps
- Use fake test data with unique emails
- Test both Invoice and Stripe payment paths
- Fail on console errors or network failures
- Take screenshots on failure

## Configuration

- **Base URL**: http://localhost:3000 (vercel dev)
- **Test Email Pattern**: `test+YYYYMMDDHHMM@local.dev`
- **Stripe Test Card**: 4242 4242 4242 4242

---

## Generated Files

### 1. Test Utilities (`qa/tests/helpers/test-utils.js`)

```javascript
/**
 * IAML QA Test Utilities
 */

/**
 * Generate a unique test email using timestamp
 * Pattern: test+YYYYMMDDHHMM@local.dev
 */
function generateTestEmail() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `test+${year}${month}${day}${hour}${min}@local.dev`;
}

/**
 * Setup console error and network failure capture
 */
function setupErrorCapture(page) {
  const errors = {
    console: [],
    network: []
  };

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.console.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // Capture network failures
  page.on('requestfailed', request => {
    errors.network.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'Unknown error'
    });
  });

  // Capture 4xx/5xx responses
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.network.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  return errors;
}

/**
 * Assert no errors occurred during test
 */
function assertNoErrors(errors, context = '') {
  const consoleErrors = errors.console.filter(e =>
    // Filter out known acceptable errors
    !e.text.includes('favicon.ico') &&
    !e.text.includes('ResizeObserver')
  );

  const networkErrors = errors.network.filter(e =>
    // Filter out known acceptable failures
    !e.url?.includes('favicon.ico') &&
    !e.url?.includes('analytics')
  );

  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }
  if (networkErrors.length > 0) {
    console.error('Network errors:', networkErrors);
  }

  expect(consoleErrors, `Console errors during ${context}`).toHaveLength(0);
  expect(networkErrors, `Network errors during ${context}`).toHaveLength(0);
}

module.exports = {
  generateTestEmail,
  setupErrorCapture,
  assertNoErrors
};
```

### 2. Registration Test (`qa/tests/registration.spec.js`)

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');
const { generateTestEmail, setupErrorCapture, assertNoErrors } = require('./helpers/test-utils');

test.describe('Registration Flow', () => {

  test.describe('In-Person Registration with Invoice', () => {

    test('complete full registration flow', async ({ page }) => {
      const errors = setupErrorCapture(page);
      const testEmail = generateTestEmail();

      // Step 1: Navigate to registration page
      await page.goto('/register.html');
      await expect(page.locator('h1')).toContainText(/register/i);

      // Step 2: Select Format - In-Person
      await page.getByRole('radio', { name: /in-person/i }).check();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 3: Select Program
      await page.waitForSelector('.program-option, [data-program]');
      // Click first program option (Certificate in Employee Relations Law)
      await page.locator('.program-option, [data-program]').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 4: Select Session
      await page.waitForSelector('.session-option, [data-session]');
      // Click first available session
      await page.locator('.session-option, [data-session]').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 5: Select Attendance (Full Program)
      await page.waitForSelector('[name="attendance"], .attendance-option');
      // Select full program if attendance step is shown
      const fullProgramOption = page.getByRole('radio', { name: /full program|all blocks/i });
      if (await fullProgramOption.isVisible()) {
        await fullProgramOption.check();
        await page.getByRole('button', { name: /next|continue/i }).click();
      }

      // Step 6: Fill Contact Information
      await page.waitForSelector('#firstName, [name="firstName"]');

      await page.fill('#firstName, [name="firstName"]', 'Test');
      await page.fill('#lastName, [name="lastName"]', 'User');
      await page.fill('#email, [name="email"]', testEmail);
      await page.fill('#phone, [name="phone"]', '555-123-4567');
      await page.fill('#contactTitle, [name="contactTitle"], [name="title"]', 'QA Tester');
      await page.fill('#company, [name="company"]', 'Test Company Inc');

      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 7: Select Payment Method - Invoice
      await page.waitForSelector('[name="paymentMethod"], .payment-option');
      await page.getByRole('radio', { name: /invoice/i }).check();

      // Fill billing information
      await page.waitForSelector('#billingContactName, [name="billingContactName"]');
      await page.fill('#billingContactName, [name="billingContactName"]', 'Billing Contact');
      await page.fill('#billingEmail, [name="billingEmail"]', testEmail);
      await page.fill('#billingAddress, [name="billingAddress"]', '123 Test Street');
      await page.fill('#billingCity, [name="billingCity"]', 'Test City');
      await page.fill('#billingState, [name="billingState"]', 'CA');
      await page.fill('#billingZip, [name="billingZip"]', '90210');

      // Step 8: Submit Registration
      await page.getByRole('button', { name: /complete|submit|register/i }).click();

      // Step 9: Verify Confirmation
      await expect(page.getByText(/registration complete|you're registered|confirmation/i)).toBeVisible({
        timeout: 30000
      });

      // Verify no errors occurred
      assertNoErrors(errors, 'in-person invoice registration');

      // Log success
      console.log(`Registration completed with email: ${testEmail}`);
    });
  });

  test.describe('Virtual Registration with Stripe Payment', () => {

    test('complete registration with credit card', async ({ page }) => {
      const errors = setupErrorCapture(page);
      const testEmail = generateTestEmail();

      // Step 1: Navigate to registration page
      await page.goto('/register.html');

      // Step 2: Select Format - Virtual
      await page.getByRole('radio', { name: /virtual/i }).check();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 3: Select Program
      await page.waitForSelector('.program-option, [data-program]');
      await page.locator('.program-option, [data-program]').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 4: Select Session
      await page.waitForSelector('.session-option, [data-session]');
      await page.locator('.session-option, [data-session]').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 5: Attendance (if shown)
      const fullProgramOption = page.getByRole('radio', { name: /full program|all blocks/i });
      if (await fullProgramOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fullProgramOption.check();
        await page.getByRole('button', { name: /next|continue/i }).click();
      }

      // Step 6: Contact Information
      await page.waitForSelector('#firstName, [name="firstName"]');

      await page.fill('#firstName, [name="firstName"]', 'Test');
      await page.fill('#lastName, [name="lastName"]', 'Stripe');
      await page.fill('#email, [name="email"]', testEmail);
      await page.fill('#phone, [name="phone"]', '555-987-6543');
      await page.fill('#contactTitle, [name="contactTitle"], [name="title"]', 'QA Engineer');
      await page.fill('#company, [name="company"]', 'Stripe Test Corp');

      await page.getByRole('button', { name: /next|continue/i }).click();

      // Step 7: Select Payment Method - Credit Card
      await page.waitForSelector('[name="paymentMethod"], .payment-option');
      await page.getByRole('radio', { name: /card|credit|pay now/i }).check();

      // Step 8: Fill Stripe Card Details
      // Wait for Stripe iframe to load
      await page.waitForSelector('iframe[name*="__privateStripeFrame"]');

      // Get Stripe iframe
      const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();

      // Fill card number
      await stripeFrame.locator('[placeholder*="Card number"], [name="cardnumber"]').fill('4242424242424242');

      // Fill expiry
      await stripeFrame.locator('[placeholder*="MM / YY"], [name="exp-date"]').fill('12/30');

      // Fill CVC
      await stripeFrame.locator('[placeholder*="CVC"], [name="cvc"]').fill('123');

      // Fill ZIP if present
      const zipField = stripeFrame.locator('[placeholder*="ZIP"], [name="postal"]');
      if (await zipField.isVisible().catch(() => false)) {
        await zipField.fill('90210');
      }

      // Step 9: Submit Payment
      await page.getByRole('button', { name: /pay|complete|submit/i }).click();

      // Step 10: Verify Payment Success
      await expect(page.getByText(/payment successful|thank you|confirmation/i)).toBeVisible({
        timeout: 60000 // Stripe can be slow
      });

      // Verify no errors
      assertNoErrors(errors, 'virtual stripe registration');

      console.log(`Stripe registration completed with email: ${testEmail}`);
    });
  });

  test.describe('Registration Form Validation', () => {

    test('shows validation errors for empty required fields', async ({ page }) => {
      await page.goto('/register.html');

      // Select format
      await page.getByRole('radio', { name: /in-person/i }).check();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Select program
      await page.waitForSelector('.program-option, [data-program]');
      await page.locator('.program-option, [data-program]').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Select session
      await page.waitForSelector('.session-option, [data-session]');
      await page.locator('.session-option, [data-session]').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Skip attendance if shown
      const fullProgramOption = page.getByRole('radio', { name: /full program/i });
      if (await fullProgramOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fullProgramOption.check();
        await page.getByRole('button', { name: /next|continue/i }).click();
      }

      // Try to proceed without filling contact info
      await page.waitForSelector('#firstName, [name="firstName"]');
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Expect validation error or form to not proceed
      const hasError = await page.locator('.error, [class*="error"], [class*="invalid"]').isVisible();
      const stillOnContactStep = await page.locator('#firstName, [name="firstName"]').isVisible();

      expect(hasError || stillOnContactStep).toBeTruthy();
    });
  });
});
```

### 3. Smoke Test (`qa/tests/smoke.spec.js`)

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');
const { setupErrorCapture, assertNoErrors } = require('./helpers/test-utils');

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/register.html', name: 'Registration' },
  { path: '/about-us', name: 'About Us' },
  { path: '/featured-programs', name: 'Featured Programs' },
  { path: '/faculty', name: 'Faculty' },
  { path: '/programs/employee-relations-law.html', name: 'Program Page' }
];

test.describe('Smoke Tests', () => {

  for (const { path, name } of PAGES) {
    test(`${name} (${path}) loads without errors`, async ({ page }) => {
      const errors = setupErrorCapture(page);

      await page.goto(path);

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Check page has content
      await expect(page.locator('body')).not.toBeEmpty();

      // Check no errors
      assertNoErrors(errors, `loading ${path}`);
    });
  }

  test('navigation links work', async ({ page }) => {
    const errors = setupErrorCapture(page);

    await page.goto('/');

    // Find and click nav links
    const navLinks = page.locator('nav a[href^="/"]');
    const linkCount = await navLinks.count();

    expect(linkCount).toBeGreaterThan(0);

    // Test first 3 nav links
    for (let i = 0; i < Math.min(3, linkCount); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && href.startsWith('/') && !href.startsWith('//')) {
        await link.click();
        await page.waitForLoadState('networkidle');

        // Verify we navigated
        expect(page.url()).toContain(href.split('#')[0]);

        // Go back for next iteration
        await page.goto('/');
      }
    }

    assertNoErrors(errors, 'navigation');
  });
});
```

---

## Execution Steps

When `/gen-registration-test` is run:

1. **Check for existing files**:
   - If `qa/tests/registration.spec.js` exists, ask if should overwrite

2. **Generate helper file**:
   - Create `qa/tests/helpers/test-utils.js` with utility functions

3. **Generate registration test**:
   - Create `qa/tests/registration.spec.js` with test scenarios

4. **Generate smoke test**:
   - Create `qa/tests/smoke.spec.js` with basic page tests

5. **Verify package.json**:
   - Ensure @playwright/test is in devDependencies
   - Ensure npm scripts are present

6. **Display next steps**:
   ```
   Registration Test Generated
   ===========================

   Files created:
   - qa/tests/helpers/test-utils.js
   - qa/tests/registration.spec.js
   - qa/tests/smoke.spec.js

   Next steps:
   1. Install dependencies: npm install
   2. Install Playwright browsers: npx playwright install chromium
   3. Start local server: vercel dev
   4. Run tests: npm run qa:registration

   Test commands:
   - npm run qa:registration  # Registration tests only
   - npm run qa:smoke         # Smoke tests only
   - npm run qa:full          # All tests
   - npm run qa:report        # View HTML report
   ```

---

## Notes

- Tests use resilient selectors (getByRole, getByLabel, getByText)
- Fallback selectors provided for complex elements
- Console errors and network failures cause test failure
- Screenshots captured on failure automatically (via playwright.config.js)
- Test email pattern allows easy identification of test data in Airtable

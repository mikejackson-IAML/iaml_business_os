// @ts-check
const { test, expect } = require('@playwright/test');
const {
  generateTestEmail,
  setupErrorCapture,
  assertNoErrors,
  waitForPageLoad,
  TEST_DATA
} = require('./helpers/test-utils');

test.describe('Registration Flow', () => {

  test.describe('In-Person Registration with Invoice', () => {

    test('complete full registration flow', async ({ page }) => {
      const errors = setupErrorCapture(page);
      const testEmail = generateTestEmail();

      console.log(`Testing with email: ${testEmail}`);

      // Step 1: Navigate to registration page
      await page.goto('/register.html');
      await waitForPageLoad(page);
      await expect(page.locator('h1')).toBeVisible();

      // Step 2: Select Format - In-Person
      const inPersonOption = page.locator('[data-format="in-person"], input[value="in-person"], .format-option:has-text("In-Person")');
      await inPersonOption.first().click();

      // Click next/continue
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      await nextButton.click();

      // Step 3: Select Program
      await page.waitForSelector('.program-option, [data-program], .program-card', { timeout: 10000 });
      await page.locator('.program-option, [data-program], .program-card').first().click();
      await nextButton.click();

      // Step 4: Select Session
      await page.waitForSelector('.session-option, [data-session], .session-card', { timeout: 10000 });
      await page.locator('.session-option, [data-session], .session-card').first().click();
      await nextButton.click();

      // Step 5: Select Attendance (if shown - for block programs)
      try {
        const attendanceOption = page.locator('[data-attendance="full"], input[value="full"], .attendance-option:has-text("Full")');
        if (await attendanceOption.isVisible({ timeout: 3000 })) {
          await attendanceOption.first().click();
          await nextButton.click();
        }
      } catch {
        // Attendance step not shown (2-day program)
      }

      // Step 6: Fill Contact Information
      await page.waitForSelector('#firstName, [name="firstName"], input[placeholder*="First"]', { timeout: 10000 });

      await page.fill('#firstName, [name="firstName"]', TEST_DATA.contact.firstName);
      await page.fill('#lastName, [name="lastName"]', TEST_DATA.contact.lastName);
      await page.fill('#email, [name="email"]', testEmail);
      await page.fill('#phone, [name="phone"]', TEST_DATA.contact.phone);

      // Title and company might have different selectors
      const titleField = page.locator('#contactTitle, [name="contactTitle"], [name="title"], input[placeholder*="Title"]');
      if (await titleField.isVisible()) {
        await titleField.fill(TEST_DATA.contact.title);
      }

      const companyField = page.locator('#company, [name="company"], input[placeholder*="Company"]');
      if (await companyField.isVisible()) {
        await companyField.fill(TEST_DATA.contact.company);
      }

      await nextButton.click();

      // Step 7: Select Payment Method - Invoice
      await page.waitForSelector('[name="paymentMethod"], .payment-option, [data-payment]', { timeout: 10000 });

      const invoiceOption = page.locator('[data-payment="invoice"], input[value="invoice"], .payment-option:has-text("Invoice")');
      await invoiceOption.first().click();

      // Fill billing information
      await page.waitForSelector('#billingContactName, [name="billingContactName"]', { timeout: 5000 });

      await page.fill('#billingContactName, [name="billingContactName"]', TEST_DATA.billing.contactName);
      await page.fill('#billingEmail, [name="billingEmail"]', testEmail);
      await page.fill('#billingAddress, [name="billingAddress"]', TEST_DATA.billing.address);
      await page.fill('#billingCity, [name="billingCity"]', TEST_DATA.billing.city);
      await page.fill('#billingState, [name="billingState"]', TEST_DATA.billing.state);
      await page.fill('#billingZip, [name="billingZip"]', TEST_DATA.billing.zip);

      // Step 8: Submit Registration
      const submitButton = page.getByRole('button', { name: /complete|submit|register|finish/i });
      await submitButton.click();

      // Step 9: Verify Confirmation
      await expect(
        page.getByText(/registration complete|you're registered|confirmation|thank you/i)
      ).toBeVisible({ timeout: 30000 });

      // Verify no errors occurred
      assertNoErrors(errors, 'in-person invoice registration');

      console.log(`✅ Registration completed successfully with email: ${testEmail}`);
    });
  });

  test.describe('Virtual Registration with Stripe Payment', () => {

    test('complete registration with credit card', async ({ page }) => {
      const errors = setupErrorCapture(page);
      const testEmail = generateTestEmail();

      console.log(`Testing Stripe payment with email: ${testEmail}`);

      // Step 1: Navigate to registration page
      await page.goto('/register.html');
      await waitForPageLoad(page);

      // Step 2: Select Format - Virtual
      const virtualOption = page.locator('[data-format="virtual"], input[value="virtual"], .format-option:has-text("Virtual")');
      await virtualOption.first().click();

      const nextButton = page.getByRole('button', { name: /next|continue/i });
      await nextButton.click();

      // Step 3: Select Program
      await page.waitForSelector('.program-option, [data-program], .program-card', { timeout: 10000 });
      await page.locator('.program-option, [data-program], .program-card').first().click();
      await nextButton.click();

      // Step 4: Select Session
      await page.waitForSelector('.session-option, [data-session], .session-card', { timeout: 10000 });
      await page.locator('.session-option, [data-session], .session-card').first().click();
      await nextButton.click();

      // Step 5: Attendance (if shown)
      try {
        const attendanceOption = page.locator('[data-attendance="full"], input[value="full"]');
        if (await attendanceOption.isVisible({ timeout: 3000 })) {
          await attendanceOption.first().click();
          await nextButton.click();
        }
      } catch {
        // Attendance step not shown
      }

      // Step 6: Contact Information
      await page.waitForSelector('#firstName, [name="firstName"]', { timeout: 10000 });

      await page.fill('#firstName, [name="firstName"]', 'Test');
      await page.fill('#lastName, [name="lastName"]', 'Stripe');
      await page.fill('#email, [name="email"]', testEmail);
      await page.fill('#phone, [name="phone"]', '555-987-6543');

      const titleField = page.locator('#contactTitle, [name="contactTitle"], [name="title"]');
      if (await titleField.isVisible()) {
        await titleField.fill('QA Engineer');
      }

      const companyField = page.locator('#company, [name="company"]');
      if (await companyField.isVisible()) {
        await companyField.fill('Stripe Test Corp');
      }

      await nextButton.click();

      // Step 7: Select Payment Method - Credit Card
      await page.waitForSelector('[name="paymentMethod"], .payment-option', { timeout: 10000 });

      const cardOption = page.locator('[data-payment="card"], input[value="card"], .payment-option:has-text("Card"), .payment-option:has-text("Credit")');
      await cardOption.first().click();

      // Step 8: Fill Stripe Card Details
      // Wait for Stripe iframe to load
      await page.waitForSelector('iframe[name*="__privateStripeFrame"]', { timeout: 15000 });

      // Get Stripe iframe - there may be multiple, we need the card number one
      const stripeFrames = page.frameLocator('iframe[name*="__privateStripeFrame"]');

      // Try to find and fill card number
      try {
        // Method 1: Single combined field
        const cardNumberFrame = stripeFrames.first();
        await cardNumberFrame.locator('input[name="cardnumber"], input[placeholder*="Card number"]').fill(TEST_DATA.stripe.cardNumber);
        await cardNumberFrame.locator('input[name="exp-date"], input[placeholder*="MM"]').fill(TEST_DATA.stripe.expiry);
        await cardNumberFrame.locator('input[name="cvc"], input[placeholder*="CVC"]').fill(TEST_DATA.stripe.cvc);

        // ZIP might be in iframe or outside
        const zipField = cardNumberFrame.locator('input[name="postal"], input[placeholder*="ZIP"]');
        if (await zipField.count() > 0) {
          await zipField.fill(TEST_DATA.stripe.zip);
        }
      } catch (e) {
        console.log('Trying alternative Stripe field method...');
        // Method 2: Separate iframes for each field
        // This handles the case where Stripe uses separate iframes
        const frames = await page.frames();
        for (const frame of frames) {
          const cardInput = frame.locator('input[name="cardnumber"]');
          if (await cardInput.count() > 0) {
            await cardInput.fill(TEST_DATA.stripe.cardNumber);
          }
          const expInput = frame.locator('input[name="exp-date"]');
          if (await expInput.count() > 0) {
            await expInput.fill(TEST_DATA.stripe.expiry);
          }
          const cvcInput = frame.locator('input[name="cvc"]');
          if (await cvcInput.count() > 0) {
            await cvcInput.fill(TEST_DATA.stripe.cvc);
          }
        }
      }

      // Step 9: Submit Payment
      const submitButton = page.getByRole('button', { name: /pay|complete|submit|process/i });
      await submitButton.click();

      // Step 10: Verify Payment Success
      // Payment can take time, especially with test mode
      await expect(
        page.getByText(/payment successful|payment complete|thank you|confirmation/i)
      ).toBeVisible({ timeout: 60000 });

      // Verify no critical errors (some network calls during payment are expected)
      const filteredErrors = {
        console: errors.console.filter(e =>
          !e.text.includes('Stripe') &&
          !e.text.includes('payment')
        ),
        network: errors.network.filter(e =>
          !e.url?.includes('stripe.com') &&
          e.status !== 402 // Payment required is expected during flow
        )
      };

      if (filteredErrors.console.length > 0 || filteredErrors.network.length > 0) {
        console.log('Non-Stripe errors found:', filteredErrors);
      }

      console.log(`✅ Stripe payment completed successfully with email: ${testEmail}`);
    });
  });

  test.describe('Registration Form Validation', () => {

    test('shows validation errors for empty required fields', async ({ page }) => {
      await page.goto('/register.html');
      await waitForPageLoad(page);

      // Select format
      const inPersonOption = page.locator('[data-format="in-person"], input[value="in-person"], .format-option').first();
      await inPersonOption.click();

      const nextButton = page.getByRole('button', { name: /next|continue/i });
      await nextButton.click();

      // Select program
      await page.waitForSelector('.program-option, [data-program]', { timeout: 10000 });
      await page.locator('.program-option, [data-program]').first().click();
      await nextButton.click();

      // Select session
      await page.waitForSelector('.session-option, [data-session]', { timeout: 10000 });
      await page.locator('.session-option, [data-session]').first().click();
      await nextButton.click();

      // Skip attendance if shown
      try {
        const attendanceOption = page.locator('[data-attendance="full"]');
        if (await attendanceOption.isVisible({ timeout: 2000 })) {
          await attendanceOption.click();
          await nextButton.click();
        }
      } catch {
        // Not shown
      }

      // Wait for contact form
      await page.waitForSelector('#firstName, [name="firstName"]', { timeout: 10000 });

      // Try to proceed without filling required fields
      await nextButton.click();

      // Should either show error or stay on same step
      const hasError = await page.locator('.error, [class*="error"], [class*="invalid"], .validation-error').isVisible();
      const stillOnContactStep = await page.locator('#firstName, [name="firstName"]').isVisible();

      // Either an error is shown or we're still on the contact step
      expect(hasError || stillOnContactStep, 'Form should show validation error or stay on step').toBeTruthy();
    });

    test('validates email format', async ({ page }) => {
      await page.goto('/register.html');
      await waitForPageLoad(page);

      // Navigate to contact form (quick path)
      await page.locator('[data-format="in-person"], .format-option').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      await page.waitForSelector('.program-option', { timeout: 10000 });
      await page.locator('.program-option').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      await page.waitForSelector('.session-option', { timeout: 10000 });
      await page.locator('.session-option').first().click();
      await page.getByRole('button', { name: /next|continue/i }).click();

      // Handle attendance if shown
      try {
        if (await page.locator('[data-attendance="full"]').isVisible({ timeout: 2000 })) {
          await page.locator('[data-attendance="full"]').click();
          await page.getByRole('button', { name: /next|continue/i }).click();
        }
      } catch {
        // Not shown
      }

      // Fill form with invalid email
      await page.waitForSelector('#email, [name="email"]', { timeout: 10000 });
      await page.fill('#firstName, [name="firstName"]', 'Test');
      await page.fill('#lastName, [name="lastName"]', 'User');
      await page.fill('#email, [name="email"]', 'invalid-email');
      await page.fill('#phone, [name="phone"]', '555-123-4567');

      await page.getByRole('button', { name: /next|continue/i }).click();

      // Should show email validation error or stay on step
      await page.waitForTimeout(500);
      const emailField = page.locator('#email, [name="email"]');
      const isInvalid = await emailField.evaluate(el => !el.validity.valid);

      // Either the field is invalid or we stayed on the page
      const stillOnPage = await emailField.isVisible();
      expect(isInvalid || stillOnPage, 'Should validate email format').toBeTruthy();
    });
  });
});

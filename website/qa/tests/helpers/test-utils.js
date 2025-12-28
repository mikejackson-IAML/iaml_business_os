/**
 * IAML QA Test Utilities
 * Shared utilities for Playwright tests
 */

const { expect } = require('@playwright/test');

/**
 * Generate a unique test email using timestamp
 * Pattern: test+YYYYMMDDHHMM@local.dev
 * @returns {string} Unique test email
 */
function generateTestEmail() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  return `test+${year}${month}${day}${hour}${min}${sec}@local.dev`;
}

/**
 * Setup console error and network failure capture on a page
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Object} Object containing arrays of captured errors
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

  // Capture failed network requests
  page.on('requestfailed', request => {
    errors.network.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText || 'Unknown error'
    });
  });

  // Capture 4xx/5xx responses
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      errors.network.push({
        url: response.url(),
        status: status,
        statusText: response.statusText()
      });
    }
  });

  return errors;
}

/**
 * Assert no errors occurred during test
 * Filters out known acceptable errors
 * @param {Object} errors - Error object from setupErrorCapture
 * @param {string} context - Context string for error messages
 */
function assertNoErrors(errors, context = '') {
  // Filter out known acceptable console errors
  const consoleErrors = errors.console.filter(e => {
    const text = e.text.toLowerCase();
    return (
      !text.includes('favicon.ico') &&
      !text.includes('resizeobserver') &&
      !text.includes('third-party cookie') &&
      !text.includes('net::err_failed') // Sometimes happens for analytics
    );
  });

  // Filter out known acceptable network errors
  const networkErrors = errors.network.filter(e => {
    const url = (e.url || '').toLowerCase();
    return (
      !url.includes('favicon.ico') &&
      !url.includes('analytics') &&
      !url.includes('googletagmanager') &&
      !url.includes('fonts.googleapis.com') &&
      !(e.status === 404 && url.includes('.map')) // Source maps
    );
  });

  if (consoleErrors.length > 0) {
    console.error(`Console errors during ${context}:`, JSON.stringify(consoleErrors, null, 2));
  }
  if (networkErrors.length > 0) {
    console.error(`Network errors during ${context}:`, JSON.stringify(networkErrors, null, 2));
  }

  expect(consoleErrors, `Console errors during ${context}`).toHaveLength(0);
  expect(networkErrors, `Network errors during ${context}`).toHaveLength(0);
}

/**
 * Wait for page to be fully loaded
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  // Additional wait for any JavaScript initialization
  await page.waitForTimeout(500);
}

/**
 * Test data for registration
 */
const TEST_DATA = {
  contact: {
    firstName: 'Test',
    lastName: 'User',
    phone: '555-123-4567',
    title: 'QA Tester',
    company: 'Test Company Inc'
  },
  billing: {
    contactName: 'Billing Contact',
    address: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    zip: '90210'
  },
  stripe: {
    cardNumber: '4242424242424242',
    expiry: '12/30',
    cvc: '123',
    zip: '90210'
  }
};

module.exports = {
  generateTestEmail,
  setupErrorCapture,
  assertNoErrors,
  waitForPageLoad,
  TEST_DATA
};

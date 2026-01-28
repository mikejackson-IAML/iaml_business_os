import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to app - Supabase auth will redirect to login if needed
  await page.goto('/dashboard');

  // Check if already logged in
  const isLoggedIn = await page.locator('[data-testid="user-menu"]').isVisible({ timeout: 5000 }).catch(() => false);

  if (!isLoggedIn) {
    // Wait for Supabase auth redirect or login form
    // The dashboard uses Supabase Auth - check if login is needed
    console.log('Auth setup: User not logged in. Manual login may be required for first run.');
    console.log('Run tests with --headed flag to log in manually, then re-run.');

    // For CI, you would use environment variables for test credentials
    // For local dev, the browser session is typically already authenticated
  }

  // Save storage state
  await page.context().storageState({ path: authFile });
});

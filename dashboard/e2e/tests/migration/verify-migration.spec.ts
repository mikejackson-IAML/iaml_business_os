import { test, expect } from '../../fixtures/auth';

test.describe('Migration Verification', () => {
  test('migration page loads', async ({ page }) => {
    await page.goto('/dashboard/planning/migrate');

    // Page should load without error
    await expect(page.getByRole('heading', { name: /migrate/i })).toBeVisible();
  });

  test('migration page shows step indicator', async ({ page }) => {
    await page.goto('/dashboard/planning/migrate');

    // Step indicator should show "1. Select"
    await expect(page.getByText('1. Select')).toBeVisible();
    await expect(page.getByText('2. Preview')).toBeVisible();
    await expect(page.getByText('3. Migrate')).toBeVisible();
  });

  test('migration page shows project selector or empty state', async ({ page }) => {
    await page.goto('/dashboard/planning/migrate');

    // Should either show projects or empty state message
    const hasProjects = await page.getByTestId('old-project-item').count() > 0;
    const hasEmptyState = await page.getByText(/no projects found/i).isVisible().catch(() => false);
    const hasSelectAll = await page.getByRole('button', { name: /select all/i }).isVisible().catch(() => false);

    // Either we have projects with Select All button, or we have empty state
    expect(hasProjects || hasEmptyState || hasSelectAll).toBeTruthy();
  });

  test('back to planning link works', async ({ page }) => {
    await page.goto('/dashboard/planning/migrate');

    // Click back link
    const backLink = page.getByRole('link', { name: /back to planning/i });
    await expect(backLink).toBeVisible();

    await backLink.click();

    // Should navigate to planning page
    await expect(page).toHaveURL('/dashboard/planning');
  });

  test('migrated projects are accessible in Planning Studio', async ({ planningPage, page }) => {
    // This test verifies that any previously migrated projects appear correctly
    await planningPage.navigate();
    await planningPage.waitForLoad();

    // Pipeline should render without errors
    await expect(page.getByTestId('pipeline-board')).toBeVisible();

    // If there are project cards, they should be clickable
    const cards = await planningPage.getProjectCards();
    if (cards.length > 0) {
      // First card should be visible
      await expect(cards[0]).toBeVisible();
    }
  });

  test('old development route redirects to planning', async ({ page }) => {
    await page.goto('/dashboard/development');

    // Should redirect to planning (308 permanent redirect)
    await expect(page).toHaveURL('/dashboard/planning');
  });

  test('old development sub-routes redirect to planning', async ({ page }) => {
    // Test a hypothetical sub-route
    await page.goto('/dashboard/development/something');

    // Should redirect to planning (sub-paths redirect to root)
    await expect(page).toHaveURL('/dashboard/planning');
  });

  test('planning pipeline board is functional after navigation', async ({ planningPage, page }) => {
    await planningPage.navigate();
    await planningPage.waitForLoad();

    // Capture button should be functional
    await expect(page.getByTestId('capture-button')).toBeEnabled();

    // Search input should be accessible
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });
});

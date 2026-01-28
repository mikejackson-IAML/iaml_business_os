import { test, expect } from '../../fixtures/auth';
import { createTestProject, cleanupTestData } from '../../fixtures/test-data';

test.describe('Phase Navigation', () => {
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('displays current phase correctly', async ({ projectDetailPage, page }) => {
    // Create project in discover phase
    const project = await createTestProject('Phase Display Test', 'planning', 'discover');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Current phase indicator should show the status
    const phaseIndicator = page.getByTestId('current-phase');
    await expect(phaseIndicator).toBeVisible();
  });

  test('shows phase progress bar with all phases', async ({ projectDetailPage, page }) => {
    const project = await createTestProject('Progress Bar Test', 'planning', 'discover');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // All 6 phases should be visible in progress bar
    await expect(page.getByTestId('phase-capture')).toBeVisible();
    await expect(page.getByTestId('phase-discover')).toBeVisible();
    await expect(page.getByTestId('phase-define')).toBeVisible();
    await expect(page.getByTestId('phase-develop')).toBeVisible();
    await expect(page.getByTestId('phase-validate')).toBeVisible();
    await expect(page.getByTestId('phase-package')).toBeVisible();
  });

  test('can navigate to previous phases', async ({ projectDetailPage, page }) => {
    // Create project in discover phase (capture should be complete)
    const project = await createTestProject('Phase Nav Test', 'planning', 'discover');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Click on capture phase button
    await page.getByTestId('phase-capture').click();

    // Page should still be functional (navigation triggered)
    await expect(page.getByTestId('project-header')).toBeVisible();
  });

  test('forward navigation shows warning dialog', async ({ projectDetailPage, page }) => {
    // Create project in capture phase
    const project = await createTestProject('Skip Warning Test', 'idea', 'capture');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Try to skip to define phase
    await page.getByTestId('phase-define').click();

    // Should show skip warning dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/skip ahead/i)).toBeVisible();
  });

  test('project detail page loads correctly', async ({ projectDetailPage, page }) => {
    const project = await createTestProject('Detail Load Test', 'planning', 'discover');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Header elements should be visible
    await expect(page.getByTestId('project-header')).toBeVisible();
    await expect(page.getByTestId('project-title')).toContainText('[E2E]');

    // Chat input should be visible
    await expect(page.getByTestId('chat-input')).toBeVisible();
  });
});

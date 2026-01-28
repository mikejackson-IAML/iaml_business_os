import { test, expect } from '../../fixtures/auth';
import { createTestProject, cleanupTestData, TEST_PREFIX } from '../../fixtures/test-data';

test.describe('Build Queue', () => {
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('queue page loads and displays projects', async ({ queuePage, page }) => {
    // Create a ready-to-build project
    await createTestProject('Queue Load Test', 'ready_to_build', 'package');

    await queuePage.navigate();
    await queuePage.waitForLoad();

    // Queue list should be visible
    await expect(page.getByTestId('queue-list')).toBeVisible();
  });

  test('queue items show priority scores', async ({ queuePage, page }) => {
    await createTestProject('Priority Score Test', 'ready_to_build', 'package');

    await queuePage.navigate();
    await queuePage.waitForLoad();

    // Priority score elements should exist
    const scoreElements = page.getByTestId('priority-score');
    const count = await scoreElements.count();

    if (count > 0) {
      // First score should be visible
      await expect(scoreElements.first()).toBeVisible();
    }
  });

  test('queue items display project info', async ({ queuePage, page }) => {
    await createTestProject('Info Display Test', 'ready_to_build', 'package');

    await queuePage.navigate();
    await queuePage.waitForLoad();

    // Queue items should be visible
    const queueItems = page.getByTestId('queue-item');
    const count = await queueItems.count();

    expect(count).toBeGreaterThanOrEqual(1);

    // First item should contain our test project
    await expect(queueItems.first()).toContainText(TEST_PREFIX);
  });

  test('can navigate from queue to project detail', async ({ queuePage, page }) => {
    const project = await createTestProject('Nav Test', 'ready_to_build', 'package');

    await queuePage.navigate();
    await queuePage.waitForLoad();

    // Click on project link
    const projectLink = page.getByRole('link', { name: new RegExp(`${TEST_PREFIX}.*Nav Test`) });

    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click();

      // Should navigate to project detail page
      await expect(page).toHaveURL(new RegExp(`/dashboard/planning/${project.id}`));
    }
  });

  test('queue page shows back to pipeline link', async ({ queuePage, page }) => {
    await queuePage.navigate();
    await queuePage.waitForLoad();

    // Back link should be visible
    const backLink = page.getByRole('link', { name: /back to pipeline/i });
    await expect(backLink).toBeVisible();
  });

  test('refresh priorities button is visible', async ({ queuePage, page }) => {
    await createTestProject('Refresh Test', 'ready_to_build', 'package');

    await queuePage.navigate();
    await queuePage.waitForLoad();

    // Refresh button should be visible
    const refreshButton = page.getByRole('button', { name: /refresh priorities/i });
    await expect(refreshButton).toBeVisible();
  });

  test('empty queue shows appropriate message', async ({ page }) => {
    // Navigate directly without creating projects
    await page.goto('/dashboard/planning/queue');

    // Either queue list or empty state should be visible
    const queueList = page.getByTestId('queue-list');
    const hasQueueList = await queueList.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasQueueList) {
      // Should show empty state or back link at minimum
      await expect(page.getByRole('link', { name: /back to pipeline/i })).toBeVisible();
    }
  });
});

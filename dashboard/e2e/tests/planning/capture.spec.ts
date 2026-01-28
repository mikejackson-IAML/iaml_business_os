import { test, expect } from '../../fixtures/auth';
import { uniqueTestName, cleanupTestData } from '../../fixtures/test-data';

test.describe('Capture Idea Flow', () => {
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('can create a new project via capture modal', async ({ planningPage, page }) => {
    const projectName = uniqueTestName('Capture Test');

    await planningPage.navigate();
    await planningPage.waitForLoad();

    await planningPage.captureIdea(projectName, 'A test project for E2E');

    // Verify project appears in Ideas column
    await expect(page.locator('[data-testid="column-idea"]')).toContainText(projectName);
  });

  test('displays validation error for empty title', async ({ planningPage, page }) => {
    await planningPage.navigate();
    await planningPage.waitForLoad();

    // Open modal and try to submit empty
    await page.getByTestId('capture-button').click();

    // Wait for modal to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Try to submit without filling title
    await page.getByRole('button', { name: /create/i }).click();

    // Expect validation - either error message or field stays required
    // The form should not close if validation fails
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('can search for projects', async ({ planningPage, page }) => {
    const projectName = uniqueTestName('Search Test');

    await planningPage.navigate();
    await planningPage.waitForLoad();

    // First create a project
    await planningPage.captureIdea(projectName);

    // Wait for project to appear
    await expect(page.locator('[data-testid="column-idea"]')).toContainText(projectName);

    // Now search for it
    await planningPage.searchProjects('Search Test');

    // Project should still be visible
    const cards = await planningPage.getProjectCards();
    expect(cards.length).toBeGreaterThan(0);
  });

  test('capture modal can be cancelled', async ({ planningPage, page }) => {
    await planningPage.navigate();
    await planningPage.waitForLoad();

    // Open modal
    await page.getByTestId('capture-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Cancel modal (click outside or press escape)
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

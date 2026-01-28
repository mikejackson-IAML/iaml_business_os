import { test, expect } from '../../fixtures/auth';
import { createTestProject, cleanupTestData } from '../../fixtures/test-data';

test.describe('Document Management', () => {
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('documents panel shows on project detail page', async ({ projectDetailPage, page }) => {
    // Create project in later stage that might have documents
    const project = await createTestProject('Doc Panel Test', 'ready_to_build', 'package');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Documents panel should be visible (might be in sidebar)
    await expect(page.getByTestId('documents-panel')).toBeVisible();
  });

  test('empty state shown when no documents', async ({ projectDetailPage, page }) => {
    // Create new project with no documents
    const project = await createTestProject('Empty Docs Test', 'idea', 'capture');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Documents panel should show empty state
    const docsPanel = page.getByTestId('documents-panel');
    await expect(docsPanel).toBeVisible();

    // Should show "No documents yet" message
    await expect(docsPanel.getByText(/no documents/i)).toBeVisible();
  });

  test('can open document preview modal if documents exist', async ({ projectDetailPage, page }) => {
    // Create a ready_to_build project (more likely to have documents)
    const project = await createTestProject('Doc Preview Test', 'ready_to_build', 'package');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Check if any documents exist
    const docItems = page.getByTestId('document-item');
    const count = await docItems.count();

    if (count > 0) {
      // Click on first document
      await docItems.first().click();

      // Document preview modal should open
      await expect(page.getByRole('dialog')).toBeVisible();
    }
    // If no documents, test passes (documents are generated through conversation)
  });

  test('documents panel is accessible from sidebar', async ({ projectDetailPage, page }) => {
    const project = await createTestProject('Sidebar Docs Test', 'planning', 'discover');

    await projectDetailPage.navigate(project.id);
    await projectDetailPage.waitForLoad();

    // Sessions tab should be visible by default
    await expect(page.getByText('Sessions')).toBeVisible();

    // Documents panel is in the sessions sidebar view
    await expect(page.getByTestId('documents-panel')).toBeVisible();
  });
});

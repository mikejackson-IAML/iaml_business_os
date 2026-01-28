import { Page, expect } from '@playwright/test';

export class PlanningPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/dashboard/planning');
  }

  async waitForLoad() {
    // Wait for pipeline board to render
    await this.page.waitForSelector('[data-testid="pipeline-board"]', { timeout: 10000 });
  }

  async captureIdea(title: string, oneLiner?: string) {
    await this.page.getByRole('button', { name: /capture/i }).click();
    await this.page.getByLabel(/title/i).fill(title);
    if (oneLiner) {
      await this.page.getByLabel(/one-liner/i).fill(oneLiner);
    }
    await this.page.getByRole('button', { name: /create/i }).click();
    // Wait for modal to close
    await expect(this.page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
  }

  async getProjectCards() {
    return this.page.locator('[data-testid="project-card"]').all();
  }

  async getColumnCount(status: string) {
    const column = this.page.locator(`[data-testid="column-${status}"]`);
    const cards = column.locator('[data-testid="project-card"]');
    return cards.count();
  }

  async clickProject(title: string) {
    await this.page.getByRole('link', { name: title }).click();
  }

  async searchProjects(query: string) {
    await this.page.getByPlaceholder(/search/i).fill(query);
  }

  async filterByStatus(status: string) {
    await this.page.getByRole('combobox', { name: /status/i }).selectOption(status);
  }
}

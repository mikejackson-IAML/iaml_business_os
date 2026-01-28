import { Page, expect } from '@playwright/test';

export class QueuePage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/dashboard/planning/queue');
  }

  async waitForLoad() {
    await this.page.waitForSelector('[data-testid="queue-list"]', { timeout: 10000 });
  }

  async getQueueItems() {
    return this.page.locator('[data-testid="queue-item"]').all();
  }

  async getItemScore(index: number) {
    const item = this.page.locator('[data-testid="queue-item"]').nth(index);
    return item.locator('[data-testid="priority-score"]').textContent();
  }

  async startBuild(projectTitle: string) {
    const item = this.page.locator('[data-testid="queue-item"]').filter({ hasText: projectTitle });
    await item.getByRole('button', { name: /start build/i }).click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
  }

  async exportProject(projectTitle: string) {
    const item = this.page.locator('[data-testid="queue-item"]').filter({ hasText: projectTitle });
    await item.getByRole('button', { name: /export/i }).click();
  }

  async refreshPriorities() {
    await this.page.getByRole('button', { name: /refresh/i }).click();
  }
}

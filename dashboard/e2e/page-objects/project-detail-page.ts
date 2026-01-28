import { Page, expect } from '@playwright/test';

export class ProjectDetailPage {
  constructor(private page: Page) {}

  async navigate(projectId: string) {
    await this.page.goto(`/dashboard/planning/${projectId}`);
  }

  async waitForLoad() {
    await this.page.waitForSelector('[data-testid="project-header"]', { timeout: 10000 });
  }

  async getProjectTitle() {
    return this.page.locator('[data-testid="project-title"]').textContent();
  }

  async getCurrentPhase() {
    return this.page.locator('[data-testid="current-phase"]').textContent();
  }

  async sendMessage(message: string) {
    await this.page.getByPlaceholder(/type.*message/i).fill(message);
    await this.page.getByRole('button', { name: /send/i }).click();
  }

  async waitForResponse() {
    // Wait for streaming to complete (assistant message appears)
    await this.page.waitForSelector('[data-testid="message-assistant"]:last-child', { timeout: 30000 });
  }

  async getMessages() {
    return this.page.locator('[data-testid^="message-"]').all();
  }

  async clickPhase(phase: string) {
    await this.page.getByRole('button', { name: new RegExp(phase, 'i') }).click();
  }

  async viewDocument(docType: string) {
    await this.page.getByRole('button', { name: new RegExp(docType, 'i') }).click();
  }
}

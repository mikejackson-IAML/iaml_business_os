import { test as base, expect } from '@playwright/test';
import { PlanningPage } from '../page-objects/planning-page';
import { ProjectDetailPage } from '../page-objects/project-detail-page';
import { QueuePage } from '../page-objects/queue-page';

// Extend base test with page objects
export const test = base.extend<{
  planningPage: PlanningPage;
  projectDetailPage: ProjectDetailPage;
  queuePage: QueuePage;
}>({
  planningPage: async ({ page }, use) => {
    await use(new PlanningPage(page));
  },
  projectDetailPage: async ({ page }, use) => {
    await use(new ProjectDetailPage(page));
  },
  queuePage: async ({ page }, use) => {
    await use(new QueuePage(page));
  },
});

export { expect } from '@playwright/test';

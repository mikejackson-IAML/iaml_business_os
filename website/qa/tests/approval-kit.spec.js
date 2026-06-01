// @ts-check
const { test, expect } = require('@playwright/test');
const { setupErrorCapture, waitForPageLoad } = require('./helpers/test-utils');

test.describe('Program approval kit', () => {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {any} config
   */
  async function exerciseApprovalKit(page, config) {
    const errors = /** @type {{ console: Array<{ text: string }> }} */ (setupErrorCapture(page));
    /** @type {null | { data: any }} */
    let approvalRequestPayload = null;
    await page.route('**/api/approval-request', async (route) => {
      approvalRequestPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, tags: ['approval_request_created', `program_slug_${config.programSlug}`] })
      });
    });

    await page.goto(config.path);
    await waitForPageLoad(page);

    await expect(page.locator('#openApprovalKit')).toBeVisible();
    await expect(page.locator('#approvalKitModal')).toHaveAttribute('aria-hidden', 'true');

    await page.locator('#openApprovalKit').click();
    await expect(page.locator('#approvalKitModal')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#approvalKitModal img[src="/images/iaml-logo.svg"]')).toBeVisible();

    await page.locator('#approvalKitForm button[type="submit"]').click();
    await expect(page.locator('#approvalKitError')).toContainText('Please complete the required fields');

    await page.locator('#approvalEmail').fill('hr.leader@example.com');
    await page.locator('#approvalAttendance').selectOption(config.attendanceOption);
    await page.locator('#approvalChallenge').selectOption('risk');
    await page.locator('#approvalName').fill('Jordan Taylor');
    await page.locator('#approvalOrganization').fill('Example Health System');
    await page.locator('#approvalContext').fill('We are standardizing workplace-law decisions across HR and managers.');
    await page.locator('#approvalKitForm button[type="submit"]').click();

    await expect(page.locator('#approvalKitResult')).toBeVisible();
    const output = await page.locator('#approvalKitOutput').inputValue();
    expect(output).toContain(`Subject: Approval request: IAML ${config.programName}`);
    expect(output).toContain('Jordan Taylor');
    expect(output).toContain(config.attendanceOption);
    expect(output).toContain(config.tuitionText);
    expect(output).toContain(config.durationText);
    expect(output).toContain(config.brochurePath);
    expect(output).toContain(config.registrationPath);
    expect(output).not.toContain('90%');
    if (!approvalRequestPayload) throw new Error('Approval request payload was not posted');
    const payload = /** @type {any} */ (approvalRequestPayload);
    const approvalData = payload.data;
    expect(approvalData).toMatchObject({
      email: 'hr.leader@example.com',
      name: 'Jordan Taylor',
      organization: 'Example Health System',
      attendance: config.attendanceOption,
      challenge: 'risk',
      programSlug: config.programSlug,
      programName: config.programName
    });
    expect(approvalData.approvalText).toContain(`Subject: Approval request: IAML ${config.programName}`);

    await page.keyboard.press('Escape');
    await expect(page.locator('#approvalKitModal')).toHaveAttribute('aria-hidden', 'true');

    const approvalKitErrors = errors.console.filter(e => /approvalKit|approval kit|approval_kit|openApprovalKit/i.test(e.text));
    expect(approvalKitErrors, 'Approval-kit script should not produce console errors').toHaveLength(0);
  }

  test('employee relations approval kit modal generates copyable manager request with brochure and logo', async ({ page }) => {
    await exerciseApprovalKit(page, {
      path: '/programs/employee-relations-law.html',
      programSlug: 'employee-relations-law',
      programName: 'Certificate in Employee Relations Law',
      attendanceOption: 'Live virtual session',
      tuitionText: '$2,375',
      durationText: '4½ days',
      brochurePath: '/brochures/output/employee-relations-law-brochure.pdf',
      registrationPath: '/register.html?program=employee-relations-law'
    });
  });

  test('manager and supervisor preview opens approval request modal and posts program-specific payload', async ({ page }) => {
    await exerciseApprovalKit(page, {
      path: '/programs/managers-supervisors-b3b-preview.html',
      programSlug: 'managers-supervisors-employment-law-training',
      programName: 'Managers & Supervisors Employment Law Training',
      attendanceOption: 'Live virtual session',
      tuitionText: '$197',
      durationText: '4 hours',
      brochurePath: '/programs/managers-supervisors-b3b-preview.html',
      registrationPath: '/program-schedule.html'
    });
  });

  test('strategic HR preview opens approval request modal and posts program-specific payload', async ({ page }) => {
    await exerciseApprovalKit(page, {
      path: '/programs/strategic-hr-leadership-b3b-preview.html',
      programSlug: 'strategic-hr-leadership',
      programName: 'Certificate in Strategic HR Leadership',
      attendanceOption: 'In-person session',
      tuitionText: '$2,375',
      durationText: '4½ days',
      brochurePath: '/programs/strategic-hr-leadership-b3b-preview.html',
      registrationPath: '/register.html?format=in-person&program=strategic-hr'
    });
  });
});

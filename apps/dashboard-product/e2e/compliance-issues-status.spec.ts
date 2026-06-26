import { expect, test } from '@playwright/test';
import { mockAuthenticatedDashboardApis, mockComplianceIssuesApis } from './helpers/api-mocks';
import { seedExporterSmokeSession, waitForSmokeUser } from './helpers/smoke-session';

test('compliance issues board resolves owned issue with mocked PATCH', async ({ page }) => {
  await seedExporterSmokeSession(page);
  await mockAuthenticatedDashboardApis(page, { primaryRole: 'exporter' });
  const issueMocks = await mockComplianceIssuesApis(page);

  await page.goto('/compliance/issues');
  await waitForSmokeUser(page, 'exporter');
  await expect(page).toHaveURL(/\/compliance\/issues/, { timeout: 15_000 });
  await expect(page.getByText('Playwright tenure gap')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Playwright tenure gap/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('issue-detail-status-select')).toBeVisible({ timeout: 15_000 });

  await page.getByTestId('issue-detail-status-select').click();
  await page.getByRole('option', { name: /progress/i }).click();

  await expect.poll(() => issueMocks.patchCalls()).toBe(1);
});

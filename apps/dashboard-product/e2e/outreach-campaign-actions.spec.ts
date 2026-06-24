import { expect, test } from '@playwright/test';
import { mockAuthenticatedDashboardApis, mockOutreachCampaignApis } from './helpers/api-mocks';
import { seedSmokeSession } from './helpers/smoke-session';

test('outreach table sends and archives draft campaign with mocked APIs', async ({ page }) => {
  await seedSmokeSession(page);
  await mockAuthenticatedDashboardApis(page);
  const outreachMocks = await mockOutreachCampaignApis(page);

  await page.goto('/outreach');
  await expect(page).toHaveURL(/\/outreach/, { timeout: 15_000 });

  await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText('campaign_playwright_draft')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Send draft|Launch draft/i }).click();
  await expect.poll(() => outreachMocks.sendCalls()).toBe(1);

  await page.getByRole('tab', { name: 'Sent' }).click();
  await expect(page.getByText('campaign_playwright_draft')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Archive' }).click();
  await expect.poll(() => outreachMocks.archiveCalls()).toBe(1);

  await page.getByRole('tab', { name: 'Archived' }).click();
  await expect(page.getByText('campaign_playwright_draft')).toBeVisible({ timeout: 15_000 });
});

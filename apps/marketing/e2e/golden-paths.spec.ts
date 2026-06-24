import { expect, test } from '@playwright/test';

const locale = 'en';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted');
  });
});

test('home page renders hero and primary navigation', async ({ page }) => {
  await page.goto(`/${locale}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Traceability infrastructure',
  );
  await expect(page.getByRole('link', { name: 'See how it works' }).first()).toBeVisible();
});

test('pricing page renders tier messaging', async ({ page }) => {
  await page.goto(`/${locale}/pricing`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Trace the source. Unlock the market.',
  );
  await expect(page.getByText('Farmers & Micro-Producers')).toBeVisible();
});

test('waitlist flow submits with mocked API', async ({ page }) => {
  await page.route('**/api/waitlist', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, confirmationSent: false, duplicate: false }),
    });
  });

  await page.goto(`/${locale}`);
  const waitlistCta = page.locator('header').getByRole('button', { name: 'Join the waitlist' });
  await waitlistCta.waitFor({ state: 'visible' });
  await waitlistCta.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('First name')).toBeVisible({ timeout: 10_000 });

  await dialog.getByLabel('First name').fill('Playwright');
  await dialog.getByLabel('Last name').fill('Smoke');
  await dialog.getByLabel('Work email').fill('playwright.smoke@tracebud.test');
  await dialog.getByLabel('Organisation').fill('Tracebud QA');

  await dialog.getByRole('combobox').nth(0).click();
  await page.getByRole('option', { name: 'Exporter' }).click();

  await dialog.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: 'Coffee' }).click();

  await dialog.getByRole('combobox').nth(2).click();
  await page.getByRole('option', { name: '1 – 50 producers' }).click();

  await dialog.getByRole('button', { name: 'Join the waitlist' }).click();

  await expect(dialog.getByText("You're on the list")).toBeVisible({ timeout: 10_000 });
  await page.waitForURL(`**/${locale}/thank-you**`, { timeout: 10_000 });
  await expect(page.getByRole('heading', { level: 1 })).toContainText("You're on the list");
});

test('delivery receipt preview shows register CTA with mocked API', async ({ page }) => {
  await page.route('**/api/delivery-preview/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        preview: {
          qrRef: 'V-PLAYWRIGHT-TEST',
          kg: 420,
          harvestDate: '2026-06-01',
          plotName: 'QA Plot North',
          plotComplianceStatus: 'verified',
          eligibleForBuyerIntake: true,
          intakeBlockReason: null,
          directedToBuyer: true,
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      }),
    });
  });

  await page.goto('/d/V-PLAYWRIGHT-TEST');
  await expect(page.getByRole('heading', { name: 'Delivery receipt' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('420 kg')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register delivery in Tracebud' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create a workspace to claim this delivery' })).toBeVisible();
});

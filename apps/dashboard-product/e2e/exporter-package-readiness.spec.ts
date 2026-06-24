import { expect, test } from '@playwright/test';
import {
  mockAuthenticatedDashboardApis,
  mockExporterPackageReadinessApis,
} from './helpers/api-mocks';
import { GOLDEN_EXPORTER_SMOKE, seedExporterSmokeSession, waitForSmokeUser } from './helpers/smoke-session';

test.describe('exporter package readiness gate', () => {
  test('assemble shipment disabled while readiness blockers present', async ({ page }) => {
    await seedExporterSmokeSession(page);
    await mockAuthenticatedDashboardApis(page, { primaryRole: 'exporter' });
    await mockExporterPackageReadinessApis(page, { blocked: true });

    await page.goto(`/packages/${GOLDEN_EXPORTER_SMOKE.packageId}`);
    await waitForSmokeUser(page, 'exporter');
    await expect(page.getByText('SHP-PW-001').first()).toBeVisible({ timeout: 20_000 });

    const assembleAction = page.getByTestId('assemble-shipment-action');
    await expect(assembleAction).toBeVisible({ timeout: 20_000 });
    await expect(assembleAction).toContainText('Assemble Shipment');
    await expect(assembleAction).toBeDisabled();
  });

  test('assemble shipment link enabled when readiness is clear', async ({ page }) => {
    await seedExporterSmokeSession(page);
    await mockAuthenticatedDashboardApis(page, { primaryRole: 'exporter' });
    await mockExporterPackageReadinessApis(page, { blocked: false });

    await page.goto(`/packages/${GOLDEN_EXPORTER_SMOKE.packageId}`);
    await waitForSmokeUser(page, 'exporter');
    await expect(page.getByText('SHP-PW-001').first()).toBeVisible({ timeout: 20_000 });

    const assembleAction = page.getByTestId('assemble-shipment-action');
    await expect(assembleAction).toBeVisible({ timeout: 20_000 });
    await expect(assembleAction).toContainText('Assemble Shipment');
    await expect(assembleAction).toHaveAttribute('href', /\/assemble$/);
  });
});

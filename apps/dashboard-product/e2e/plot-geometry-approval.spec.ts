import { expect, test } from '@playwright/test';
import {
  mockAuthenticatedDashboardApis,
  mockPlotGeometryApprovalApis,
} from './helpers/api-mocks';
import { GOLDEN_EXPORTER_SMOKE, seedExporterSmokeSession, waitForSmokeUser } from './helpers/smoke-session';

test.describe('plot geometry approval', () => {
  test('exporter approves low-confidence geometry from plot dossier', async ({ page }) => {
    await seedExporterSmokeSession(page);
    await mockAuthenticatedDashboardApis(page, { primaryRole: 'exporter' });
    await mockPlotGeometryApprovalApis(page, { approved: false });

    await page.goto(`/plots/${GOLDEN_EXPORTER_SMOKE.packageId}`);
    await waitForSmokeUser(page, 'exporter');

    const card = page.getByTestId('plot-geometry-approval-card');
    await expect(card).toBeVisible({ timeout: 20_000 });

    const action = page.getByTestId('plot-geometry-approval-action');
    await expect(action).toBeVisible();
    await action.click();

    await expect(page.getByText('Geometry approved for shipment coverage.').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('plot-geometry-approval-badge')).toContainText('Approved');
  });
});

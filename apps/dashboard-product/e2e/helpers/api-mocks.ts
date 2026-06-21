import type { Page } from '@playwright/test';
import { GOLDEN_SMOKE } from './smoke-session';

const EMPTY_METRICS = {
  total_packages: 0,
  packages_by_status: {
    DRAFT: 0,
    READY: 0,
    SEALED: 0,
    SUBMITTED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  },
  total_plots: 0,
  compliant_plots: 0,
  total_farmers: 0,
  incoming_requests_pending: 0,
  outgoing_requests_pending: 0,
  blocking_issues_count: 0,
  yield_failures_count: 0,
  upstream_blockers_count: 0,
  owned_blocking_issues_count: 0,
  recent_activity: [],
};

export async function mockAuthenticatedDashboardApis(page: Page): Promise<void> {
  await page.route('**/api/launch/commercial-profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          tenant_id: GOLDEN_SMOKE.tenantId,
          organization_name: GOLDEN_SMOKE.organizationName,
          country: 'RW',
          primary_role: 'importer',
          supply_chain_roles: ['importer'],
          team_size: null,
          main_commodity: 'coffee',
          primary_objective: null,
          profile_skipped: false,
          updated_at: new Date().toISOString(),
        },
      }),
    });
  });

  await page.route('**/api/dashboard/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        metrics: EMPTY_METRICS,
        packages: [],
        campaigns: [],
      }),
    });
  });

  await page.route('**/api/launch/state', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lifecycle_status: 'active',
        trial_expires_at: null,
      }),
    });
  });
}

export async function mockSupabasePasswordGrant(page: Page, accessToken: string): Promise<void> {
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: 'playwright-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
      }),
    });
  });
}

export async function mockOnboardingProxy(page: Page): Promise<{
  getCalls: () => number;
  postBodies: () => Array<{ role: string; stepKey: string }>;
}> {
  let getCount = 0;
  const postPayloads: Array<{ role: string; stepKey: string }> = [];

  await page.route('**/api/launch/onboarding**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      getCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{ step_key: GOLDEN_SMOKE.onboardingStepKey, completed: false }],
        }),
      });
      return;
    }

    if (request.method() === 'POST') {
      const body = (request.postDataJSON() ?? {}) as { role?: string; stepKey?: string };
      postPayloads.push({
        role: body.role ?? '',
        stepKey: body.stepKey ?? '',
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
      return;
    }

    await route.continue();
  });

  return {
    getCalls: () => getCount,
    postBodies: () => postPayloads,
  };
}
